import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query'

import { getDirections, getGPSData, getSectionData, getAllGPSData } from '../utils/supabase/processor-queries';

import * as XLSX from "xlsx";
import { AgGridReact, agGridReact } from 'ag-grid-react';

export default function processing() {
    const tabs = [
        { id: "tenthMile", label: "Tenth Mile Processor & QA" },
        { id: "RQC", label: "Ride Quality Test Checker" },
    ];

    const [activeTab, setActiveTab] = useState(tabs[0].id);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="text-black flex max-w-screen bg-gray-400 h-12">
                {tabs.map((tab) => (
                    <button className=
                        {
                            `text-black border-2 text-center w-56 h-12 
                    ${activeTab === tab.id ? "bg-green-200 bold hover:bg-green-400" : "bg-white hover:bg-gray-300"}`
                        }
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            fontWeight: activeTab === tab.id ? "bold" : "normal",
                        }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Forms */}
            <div className="bg-[#D1EAF0] w-full h-full overflow-y-auto">
                {activeTab === "tenthMile" && <TenthMileProcessor />}
                {activeTab === "RQC" && <RideQualityChecker />}
            </div>
        </div>
    );
}

function TenthMileProcessor() {
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    const [results, setResults] = useState({
        contiguous: [],
        distinctConflicts: [],
        filteredGPS: [],
        noRut: [],
        noDistress: [],
        IRI25: [],
        noMPD: [],
    });

    function ResultGrid({ title, data }) {
        const columnDefs = React.useMemo(() => {
            if (!data.length) return [];

            return Object.keys(data[0]).map((key) => ({
                field: key,
                sortable: true,
                filter: true,
            }));
        }, [data]);

        return (
            <div className="rounded text-black">
                <h2 className="font-bold mb-2">{title}</h2>

                <div
                    className='h-120 w-full'
                >
                    <AgGridReact
                        rowData={data}
                        columnDefs={columnDefs}
                        defaultColDef={{ flex: 1, minWidth: 120 }}
                    />
                </div>
            </div>
        );
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setFileName(file.name);
        setSelectedFile(file);
    };

    const handleImport = async (e) => {
        const checkForDupes = (jsonData) => {
            const seen = new Map();
            const duplicates = [];

            jsonData.forEach(row => {
                const key = `${row.Route}|${row.Dir}|${row.FromMP}`;

                if (seen.has(key)) {
                    duplicates.push({
                        Route: row.Route,
                        Dir: row.Dir,
                        FromMP: row.FromMP
                    });
                } else {
                    seen.set(key, true);
                }
            });

            if (duplicates.length > 0) {
                let dupeMsg = duplicates
                    .map(d => `${d.Route} ${d.Dir} ${d.FromMP}`)
                    .join("\n");

                alert(
                    `DUPLICATE MILEPOSTS FOUND\n\n${dupeMsg}\n\nResolve in spreadsheet then import again.`
                );

                return true;
            }

            return false;
        };

        const StandardRound = (pValue, pDecimalPlaces) => {
            if (pDecimalPlaces < 0) {
                throw new Error("Decimal places cannot be negative");
            }

            const LDecimalSymbol = "."; // Changes based on country
            const LValue = pValue.toString();
            const LPos = LValue.indexOf(LDecimalSymbol);
            const LNumDecimals = LValue.length - LPos - 1;

            if (LPos > 0 && LNumDecimals > 0 && LNumDecimals > pDecimalPlaces) {
                let QValue = (1 / (10 ** (LNumDecimals + 1)));

                if (pValue < 0) QValue = -QValue;

                return Math.round((pValue + QValue) * Math.pow(10, pDecimalPlaces)) / Math.pow(10, pDecimalPlaces);
            } else {
                return pValue;
            }
        }

        const calcSDI = (jsonData) => {
            const calcIndex = (Rte, Dir, MPFrom, RutAvg, D) => {
                const severityCoeff = [
                    3.2, // D(1)
                    3.6, // D(2)
                    4.0, // D(3)

                    3.2, // D(4)
                    3.6, // D(5)
                    4.0, // D(6)

                    3.2, // D(7)
                    3.6, // D(8)
                    4.0, // D(9)

                    3.2, // D(10)
                    3.6, // D(11)
                    4.0, // D(12)

                    3.2, // D(13)
                    3.6, // D(14)
                    4.0, // D(15)

                    0.8, // D(16)
                    0.9, // D(17)
                    1.0, // D(18)

                    0.8, // D(19)
                    0.9, // D(20)
                    1.0, // D(21)

                    0.8, // D(22)
                    0.9, // D(23)
                    1.0  // D(24)
                ];

                const distressWeight = [
                    220, // D(1)
                    220, // D(2)
                    220, // D(3)

                    140, // D(4)
                    140, // D(5)
                    140, // D(6)

                    140, // D(7)
                    140, // D(8)
                    140, // D(9)

                    210, // D(10)
                    210, // D(11)
                    210, // D(12)

                    140, // D(13)
                    140, // D(14)
                    140, // D(15)

                    100, // D(16)
                    100, // D(17)
                    100, // D(18)

                    145, // D(19)
                    145, // D(20)
                    145, // D(21)

                    145, // D(22)
                    145, // D(23)
                    145  // D(24)
                ];

                let NDI = 5, LDI = 5, NDIWeight = 0, LDIWeight = 0;

                for (let i = 0; i <= 23; i += 3) {
                    const totalPercent = D[i] + D[i + 1] + D[i + 2];

                    if (totalPercent > 100.1) {
                        alert(
                            `(Slight + Moderate + Servere) distress percents add up to more than 100 percent on the record in the update table for (Rte ${Rte} Dir ${Dir} MP ${MPFrom}). The NDI and LDI values for this record will be set to 9.99. Correct the problem and recalculate.`
                        );

                        NDI = 9.99;
                        LDI = 9.99;

                        return {
                            NDI, LDI
                        };
                    } else if (totalPercent === 100.1) {
                        if (D[i] < D[i + 1] && D[0] < D[i + 2]) {
                            D[i] = D[0] - 0.1
                        } else if (D[i + 1] < D[i] && D[i + 1] < D[i + 2]) {
                            D[i + 1] = D[i + 1] - 0.1
                        } else {
                            D[i + 2] = D[i + 2] - 0.1
                        }
                    }
                }

                // Check Concrete & Asphalt
                let haveRC = false, haveAC = false
                for (let i = 15; i <= 23; i++) {
                    if (D[i] > 0) {
                        haveRC = true
                        break;
                    }
                }

                for (let i = 0; i <= 8; i++) {
                    if (D[i] > 0) {
                        haveAC = true
                        break;
                    }
                }

                if (haveRC && haveAC) {
                    alert(
                        `There are both concrete AND asphalt distress ratings on the record in the update table for\n(Rte ${Rte} Dir ${Dir} MP ${MPFrom}). The NDI and LDI values for this record will be set to 9.99. Correct the problem and recalculate.`
                    );

                    NDI = 9.99;
                    LDI = 9.99;

                    return {
                        NDI, LDI
                    };
                } else if (!haveRC) {
                    for (let i = 0; i <= 8; i++) {
                        if (D[i] > 0) {
                            NDIWeight += severityCoeff[i] * distressWeight[i] * (D[i] / 100)
                        }
                    }
                    for (let i = 15; i <= 23; i++) {
                        if (D[i] > 0) {
                            NDIWeight += severityCoeff[i] * distressWeight[i] * (D[i] / 100)
                        }
                    }

                    NDI = (500 - NDIWeight) / 100;

                    for (let i = 9; i <= 14; i++) {
                        if (D[i] > 0) {
                            LDIWeight += severityCoeff[i] * distressWeight[i] * (D[i] / 100)
                        }
                    }

                    let RndAvgRut = Math.round(RutAvg * 100) / 100;

                    if (RndAvgRut > 0.2) {
                        if (RndAvgRut >= 0.8) {
                            LDIWeight = LDIWeight + 150;
                        } else {
                            LDIWeight = LDIWeight + 150 * (RndAvgRut - 0.2) * 5 / 3
                        }
                    }

                    LDI = (500 - LDIWeight) / 100

                    return {
                        NDI, LDI
                    };
                } else {
                    for (let i = 15; i <= 23; i++) {
                        if (D[i] > 0) {
                            NDIWeight += severityCoeff[i] * distressWeight[i] * (D[i] / 100)
                        }
                    }
                    NDI = (500 - NDIWeight) / 100;

                    return {
                        NDI, LDI
                    };
                }
            };

            const calcGFP = (SDI, IRI) => {
                if ((IRI >= 95 && IRI <= 170 && SDI > 3.2) || (IRI < 95 && SDI > 3.2 && SDI < 4.34)) {
                    return "Fair";
                } else if (IRI < 95 && SDI >= 4.34) {
                    return "Good";
                } else if (IRI > 170 && SDI <= 3.2) {
                    return "Poor_Both";
                } else if (IRI > 170 && SDI > 3.2) {
                    return "Poor_IRI";
                } else if (IRI <= 170 && SDI <= 3.2) {
                    return "Poor_SDI";
                } else {
                    return "Error";
                }
            }

            jsonData = jsonData.map((item) => {
                const D = [
                    item["Patt%AreaSl"],          // D(1)
                    item["Patt%AreaMod"],         // D(2)
                    item["Patt%AreaSev"],         // D(3)

                    item["Tr%AreaSl"],            // D(4)
                    item["Tr%AreaMod"],           // D(5)
                    item["Tr%AreaSev"],           // D(6)

                    item["Lng%AreaSl"],           // D(7)
                    item["Lng%AreaMod"],          // D(8)
                    item["Lng%AreaSev"],           // D(9)

                    item["WpPatt%AreaSl"],        // D(10)
                    item["WpPatt%AreaMod"],       // D(11)
                    item["WpPatt%AreaSev"],       // D(12)

                    item["WpLng%AreaSl"],         // D(13)
                    item["WpLng%AreaMod"],        // D(14)
                    item["WpLng%AreaSev"],        // D(15)

                    item["PCCCr%AreaSl"],         // D(16)
                    item["PCCCr%AreaMod"],        // D(17)
                    item["PCCCr%AreaSev"],        // D(18)

                    item["PCCLngSpallLenSl"],     // D(19)
                    item["PCCLngSpallLenMod"],    // D(20)
                    item["PCCLngSpallLenSev"],    // D(21)

                    item["PCCTrSpallLenSl"],      // D(22)
                    item["PCCTrSpallLenMod"],     // D(23)
                    item["PCCTrSpallLenSev"]      // D(24)
                ];

                let { NDI, LDI } = calcIndex(item.Rte, item.Dir, item.FromMP, item.RutAvg, D);

                NDI = StandardRound(NDI, 2);
                LDI = StandardRound(LDI, 2);

                if (NDI < 0 && LDI < 0) {
                    item.RawSDI = StandardRound((NDI * LDI / 5) * -1, 2);
                } else {
                    item.RawSDI = StandardRound(NDI * LDI / 5, 2);
                }

                if (NDI < 0) NDI = 0;
                if (LDI < 0) LDI = 0;

                item.SDI = StandardRound(NDI * LDI / 5, 2);
                item.GFP = calcGFP(item.SDI, item.IriAvg);

                item.NDI = NDI;
                item.LDI = LDI;
                return item;
            });
        };

        const buildContiguous = (jsonData) => {
            const contiguous = [];
            const noDistress = [];
            const noMPD = [];
            const noRut = [];

            jsonData.forEach(item => {
                item.Sum_Distress =
                    item["Patt%AreaSl"] +
                    item["Patt%AreaMod"] +
                    item["Patt%AreaSev"] +
                    item["Lng%AreaSl"] +
                    item["Lng%AreaMod"] +
                    item["Lng%AreaSev"] +
                    item["Tr%AreaSl"] +
                    item["Tr%AreaMod"] +
                    item["Tr%AreaSev"] +
                    item["WpPatt%AreaSl"] +
                    item["WpPatt%AreaMod"] +
                    item["WpPatt%AreaSev"] +
                    item["WpLng%AreaSl"] +
                    item["WpLng%AreaMod"] +
                    item["WpLng%AreaSev"] +
                    item["PCCCr%AreaSl"] +
                    item["PCCCr%AreaMod"] +
                    item["PCCCr%AreaSev"];
            });

            jsonData.sort((a, b) => {
                return (
                    a.Route.localeCompare(b.Route) ||
                    a.Dir.localeCompare(b.Dir) ||
                    a.FromMP - b.FromMP
                );
            });

            // Contiguous
            let i = 0;
            while (i < jsonData.length) {
                const item = jsonData[i];

                let Rte = item.Route.trim();
                let Dir = item.Dir.trim();

                let contigStart = item.FromMP;
                let contigEnd = contigStart + 0.1;
                let latestDate = item.TestDate;
                let SetNum = item["Set#"] ?? 0;

                let j = i;
                while (j + 1 < jsonData.length) {
                    const currItem = jsonData[j];
                    const nextItem = jsonData[j + 1];

                    const MP1 = StandardRound(currItem.FromMP + 0.1, 2);
                    const MP2 = StandardRound(nextItem.FromMP, 2);

                    if (nextItem.Route.trim() === Rte && nextItem.Dir.trim() === Dir && StandardRound(MP2 - MP1, 2) <= 0) {
                        contigEnd = nextItem.FromMP + 0.1;

                        if (nextItem.TestDate > latestDate) {
                            latestDate = nextItem.TestDate;
                        }

                        Rte = currItem.Route.trim();
                        Dir = currItem.Dir.trim();
                    } else {
                        break;
                    }

                    j++;
                }

                // write section
                contiguous.push({
                    Rte,
                    Dir,
                    MPStart: StandardRound(contigStart, 1),
                    MPEnd: StandardRound(contigEnd, 1),
                    ProfilerDate: latestDate,
                    Set_Num: SetNum
                })

                i = j + 1;
            }

            // No Distress
            i = 0;
            while (i < jsonData.length) {
                const item = jsonData[i];

                if (item.Sum_Distress !== 0) {
                    i++;
                    continue;
                }

                let Rte = item.Route.trim();
                let Dir = item.Dir.trim();

                let contigStart = item.FromMP;
                let contigEnd = contigStart + 0.1;
                let latestDate = item.TestDate;
                let SetNum = item["Set#"]

                let j = i;
                while (j + 1 < jsonData.length) {
                    const currItem = jsonData[j];
                    const nextItem = jsonData[j + 1];
                    const MP1 = StandardRound(currItem.FromMP + 0.1, 2);

                    if (nextItem.Sum_Distress === 0) {
                        const MP2 = StandardRound(nextItem.FromMP, 2);
                        if (nextItem.Route.trim() === Rte && nextItem.Dir.trim() === Dir && StandardRound(MP2 - MP1, 2) <= 0) {
                            contigEnd = nextItem.FromMP + 0.1;

                            if (nextItem.TestDate > latestDate) {
                                latestDate = nextItem.TestDate;
                            }

                            Rte = currItem.Route.trim();
                            Dir = currItem.Dir.trim();
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }

                    j++;
                }

                if (StandardRound(contigEnd - contigStart, 2) >= 0.3) {
                    noDistress.push({
                        Rte,
                        Dir,
                        MPStart: StandardRound(contigStart, 1),
                        MPEnd: StandardRound(contigEnd, 1),
                        ProfilerDate: latestDate,
                        Set_Num: SetNum
                    })
                }

                i = j + 1;
            }

            // No MPD
            i = 0;
            while (i < jsonData.length) {
                const item = jsonData[i];

                if (item.MPD !== 0) {
                    i++;
                    continue;
                }

                let Rte = item.Route.trim();
                let Dir = item.Dir.trim();

                let contigStart = item.FromMP;
                let contigEnd = contigStart + 0.1;
                let latestDate = item.TestDate;
                let SetNum = item["Set#"]

                let j = i;
                while (j + 1 < jsonData.length) {
                    const currItem = jsonData[j];
                    const nextItem = jsonData[j + 1];
                    const MP1 = StandardRound(currItem.FromMP + 0.1, 2);

                    if (nextItem.MPD === 0) {
                        const MP2 = StandardRound(nextItem.FromMP, 2);
                        if (nextItem.Route.trim() === Rte && nextItem.Dir.trim() === Dir && StandardRound(MP2 - MP1, 2) <= 0) {
                            contigEnd = nextItem.FromMP + 0.1;

                            if (nextItem.TestDate > latestDate) {
                                latestDate = nextItem.TestDate;
                            }

                            Rte = currItem.Route.trim();
                            Dir = currItem.Dir.trim();
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }

                    j++;
                }

                noMPD.push({
                    Rte,
                    Dir,
                    MPStart: StandardRound(contigStart, 1),
                    MPEnd: StandardRound(contigEnd, 1),
                    ProfilerDate: latestDate,
                    Set_Num: SetNum,
                });

                i = j + 1;
            }

            // No Rut
            i = 0;
            while (i < jsonData.length) {
                const item = jsonData[i];

                if (item.RutAvg !== 0 || item.MaxLtRut !== 0 || item.MaxRtRut !== 0) {
                    i++;
                    continue;
                }

                let Rte = item.Route.trim();
                let Dir = item.Dir.trim();

                let contigStart = item.FromMP;
                let contigEnd = contigStart + 0.1;
                let latestDate = item.TestDate;
                let SetNum = item["Set#"]

                let j = i;
                while (j + 1 < jsonData.length) {
                    const currItem = jsonData[j];
                    const nextItem = jsonData[j + 1];
                    const MP1 = StandardRound(currItem.FromMP + 0.1, 2);

                    if (nextItem.RutAvg === 0 && nextItem.MaxLtRut === 0 && nextItem.MaxRtRut === 0) {
                        const MP2 = StandardRound(nextItem.FromMP, 2);
                        if (nextItem.Route.trim() === Rte && nextItem.Dir.trim() === Dir && StandardRound(MP2 - MP1, 2) <= 0) {
                            contigEnd = nextItem.FromMP + 0.1;

                            if (nextItem.TestDate > latestDate) {
                                latestDate = nextItem.TestDate;
                            }

                            Rte = currItem.Route.trim();
                            Dir = currItem.Dir.trim();
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }

                    j++;
                }

                noRut.push({
                    Rte,
                    Dir,
                    MPStart: StandardRound(contigStart, 1),
                    MPEnd: StandardRound(contigEnd, 1),
                    ProfilerDate: latestDate,
                    Set_Num: SetNum,
                });

                i = j + 1;
            }

            return {
                contiguous,
                noDistress,
                noMPD,
                noRut
            };
        };

        const checkMissingMileposts = (jsonData, contiguous) => {
            let Route = contiguous[0].Rte
            let Direction = contiguous[0].Dir
            let MPStart = contiguous[0].MPEnd

            let i = 0
            while (i + 1 < contiguous.length) {
                const nextItem = contiguous[i + 1];

                if (nextItem.Rte === Route && nextItem.Dir === Direction && Math.round((nextItem.MPStart - MPStart) * 10) / 10 === 0.1) {
                    //const newItem = { ...nextItem };
                    const newItem = jsonData.find(item =>
                        item.Route === Route &&
                        item.Dir === Direction &&
                        item.FromTo === MPStart
                    );

                    if (newItem) {
                        const newItemClone = { ...newItem };

                        newItemClone.FromMP = MPStart;
                        newItemClone.ToMP = Math.round((newItemClone.MPStart - MPStart) * 10) / 10
                        jsonData.push(newItemClone);
                    }
                }

                Route = nextItem.Rte;
                Direction = nextItem.Dir;
                MPStart = nextItem.MPEnd;
                i++;
            }
        };

        const getDistance = (newLat, oldLat, newLon, oldLon) => {
            const toRadians = degrees => degrees * Math.PI / 180;

            let cosValue = Math.cos(toRadians(90 - newLat)) * Math.cos(toRadians(90 - oldLat)) + Math.sin(toRadians(90 - newLat)) * Math.sin(toRadians(90 - oldLat)) * Math.cos(toRadians(newLon - oldLon));
            cosValue = Math.min(1, Math.max(-1, cosValue));
            return (Math.acos(cosValue) * 6371000) * 0.00062137;
        }

        if (!selectedFile) {
            alert("Please select an Excel file first.");
            return;
        }

        // Store Excel file as JSON using XLSX Library
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        let jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Query directions table
        const directions = await getDirections();

        jsonData = jsonData.map((row, index) => {
            let fromMP = Number(row.FromMP);

            if (row.Dir === "D") {
                fromMP = Number(row.ToMP);
                row.ToLatitude = row.FromLatitude;
                row.ToLongitude = row.FromLongitude;
                row.FromLatitude = null;
                row.FromLongitude = null;

                row.Dir = directions.find((item) => item.Rte.trim() === row.Route.trim()).Secondary_Dir;
            } else if (row.Dir === "I") {
                row.Dir = directions.find((item) => item.Rte.trim() === row.Route.trim()).Primary_Dir;
            }

            // Format Route field
            let route = row.Route == null ? "" : String(row.Route).trim();

            if (/^\d+$/.test(route)) {
                route = route.padStart(3, "0");
            } else if (route.length > 0 && isNaN(route.slice(-1))) {
                const numberPart = route.slice(0, -1).trim();
                route =
                    Number(numberPart).toString().padStart(3, "0") +
                    route.slice(-1).toUpperCase();
            }

            return {
                ...row,
                FromMP: fromMP,
                ToMP: Math.round((fromMP + 0.1) * 10) / 10,
                Route: route,
                SDI: null,
                NDI: null,
                LDI: null,
                RawSDI: null,
                GFP: "",
                ID: index + 1,
                DateAdded: new Date()
            };
        }).filter(row => row.Route !== "");

        // Remove columns
        const columnsToRemove = [
            "MC_S", "MC_M", "MC_E",
            "t_Crck_S", "t_Crck_M", "t_Crck_E",
            "LC_S", "LC_M", "LC_E",
            "MCLA_S", "MCLA_M", "MCLA_E",
            "LCLA_S", "LCLA_M", "LCLA_E",
            "Patch_S", "Patch_M", "Patch_E",
            "S_Cond_S", "S_Cond_M", "S_Cond_E",
            "S_Drop_S", "S_Drop_M", "S_Drop_E",
            "Crack_S", "Crack_M", "Crack_E",
            "FaultS", "FaultM", "FaultE",
            "LongJ_S", "LongJ_M", "LongJ_E",
            "TranJ_S", "TranJ_M", "TranJ_E",
            "SDI", "NDI", "LDI", "RawSDI"
        ];

        jsonData = jsonData.map(row => {
            const newRow = { ...row };

            columnsToRemove.forEach(col => delete newRow[col]);

            return newRow;
        });

        // Duplicate records check
        if (checkForDupes(jsonData)) {
            return;
        }

        // Calculate NDI/LDI/SDI
        calcSDI(jsonData);

        // Build contiguous sections
        const { contiguous, noDistress, noMPD, noRut } = buildContiguous(jsonData);

        // Check for gaps in contiguous
        checkMissingMileposts(jsonData, contiguous);

        const routes = [...new Set(jsonData.map(item => item.Route))];
        const GPSData = await getAllGPSData(routes);

        const GPSCheck = [];

        function bankersRound(value, decimals = 0) {
            const factor = Math.pow(10, decimals);
            const scaled = value * factor;
            const rounded = Math.round(scaled);

            if (Math.abs(scaled - (rounded - 0.5)) < Number.EPSILON) {
                return (rounded - 1) / factor;
            }

            if (Math.abs(scaled - (rounded + 0.5)) < Number.EPSILON) {
                return rounded % 2 === 0
                    ? rounded / factor
                    : (rounded + 1) / factor;
            }

            return rounded / factor;
        }

        let primaryCount = 0;
        let secondaryCount = 0;

        function normalizeText(value) {
            return String(value ?? "").trim().toUpperCase();
        }

        function normalizeMP(value) {
            return Number(Number(value).toFixed(3));
        }

        function sameMP(a, b) {
            return normalizeMP(a) === normalizeMP(b);
        }

        function sameRoute(a, b) {
            return normalizeText(a) === normalizeText(b);
        }

        function sameDir(a, b) {
            return normalizeText(a) === normalizeText(b);
        }


        // Primary SQL equivalent:
        // tblGPS INNER JOIN tblProfilerUpdate ON GPS.MPFrom = Profiler.FromMP
        for (const gps of GPSData) {

            for (const item of jsonData) {

                if (
                    !sameRoute(gps.Rte, item.Route) ||
                    !sameDir(gps.Dir, item.Dir) ||
                    !sameMP(gps.MPFrom, item.FromMP)
                ) {
                    continue;
                }

                if (
                    item.FromLatitude == null ||
                    item.FromLongitude == null
                ) {
                    continue;
                }

                primaryCount++;

                GPSCheck.push({
                    Source: "Primary",
                    MatchedMP: gps.MPFrom,
                    Route: item.Route,
                    Direction: item.Dir,
                    FromMP: item.FromMP,
                    ToMP: item.ToMP,
                    Latitude: item.FromLatitude,
                    Longitude: item.FromLongitude,
                    GIS_Latitude: gps.Latitude,
                    GIS_Longitude: gps.Longitude,
                    Diff_Miles: bankersRound(
                        getDistance(
                            item.FromLatitude,
                            gps.Latitude,
                            item.FromLongitude,
                            gps.Longitude
                        ),
                        2
                    )
                });
            }
        }


        // Secondary SQL equivalent:
        // tblGPS INNER JOIN tblProfilerUpdate ON GPS.MPFrom = Profiler.ToMP
        for (const gps of GPSData) {

            for (const item of jsonData) {

                if (
                    !sameRoute(gps.Rte, item.Route) ||
                    !sameDir(gps.Dir, item.Dir) ||
                    !sameMP(gps.MPFrom, item.ToMP)
                ) {
                    continue;
                }

                if (
                    item.ToLatitude == null ||
                    item.ToLongitude == null
                ) {
                    continue;
                }

                secondaryCount++;

                GPSCheck.push({
                    Source: "Secondary",
                    MatchedMP: gps.MPFrom,
                    Route: item.Route,
                    Direction: item.Dir,
                    FromMP: item.FromMP,
                    ToMP: item.ToMP,
                    Latitude: item.ToLatitude,
                    Longitude: item.ToLongitude,
                    GIS_Latitude: gps.Latitude,
                    GIS_Longitude: gps.Longitude,
                    RawDistance: getDistance(
                        item.ToLatitude,
                        gps.Latitude,
                        item.ToLongitude,
                        gps.Longitude
                    ),
                    Diff_Miles: bankersRound(
                        getDistance(
                            item.ToLatitude,
                            gps.Latitude,
                            item.ToLongitude,
                            gps.Longitude
                        ),
                        2
                    )
                });
            }
        }

        const filteredGPS = GPSCheck.filter((item) => item.Diff_Miles >= 0.1); // few extra, trying to replicate Access Rounding, but not perfect

        // Query Road Sections and build conflict array
        const sectionData = await getSectionData();
        const conflicts = [];

        for (const c of contiguous) {
            for (const s of sectionData) {
                if (s.Rte !== c.Rte || s.Dir !== c.Dir) continue;

                const overlaps =
                    (s.MPStart >= c.MPStart && s.MPStart < c.MPEnd) ||
                    (s.MPEnd <= c.MPEnd && s.MPEnd > c.MPStart) ||
                    (s.MPStart <= c.MPStart && s.MPEnd >= c.MPEnd);

                if (overlaps) {
                    conflicts.push({
                        Rte: s.Rte,
                        Dir: s.Dir,
                        MPStart: s.MPStart,
                        MPEnd: s.MPEnd
                    });
                }
            }
        }

        // Remove dupes
        const distinctConflicts = [
            ...new Map(
                conflicts.map(r => [
                    `${r.Rte}|${r.Dir}|${r.MPStart}|${r.MPEnd}`,
                    r
                ])
            ).values()
        ];

        // Print stuff cuz no tables yet
        console.log(contiguous);
        console.log(noDistress);
        console.log(noMPD);
        console.log(noRut);

        // IRI = 25
        const IRI25 = jsonData.filter((item) => item.IriAvg === 25);
        console.log(IRI25);

        // GPS Check where diff miles >= 0.1
        console.log(filteredGPS);

        // Conflicts
        console.log(distinctConflicts);

        setResults({
            contiguous,
            distinctConflicts,
            filteredGPS,
            noRut,
            noDistress,
            IRI25,
            noMPD,
        });
    };

    return (
        <div className="p-4">
            <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-black">
                    File:
                </label>

                <div className="flex items-center gap-2 flex-1">
                    <input
                        className="w-64 h-8 border border-gray-500 rounded px-2 bg-white text-sm text-black"
                        value={fileName}
                        readOnly
                        placeholder="No file selected"
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="bg-blue-500 text-white px-4 h-8 rounded hover:bg-blue-600"
                    >
                        Browse
                    </button>

                    <button
                        type="button"
                        onClick={handleImport}
                        className="bg-blue-500 text-white px-4 h-8 rounded hover:bg-blue-600"
                    >
                        Import
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            </div>

            <div className="mt-6 space-y-6">
                <div className="grid grid-cols-4 gap-4">
                    <ResultGrid
                        title="Currently Loaded Section Info"
                        data={results.contiguous}
                    />

                    <ResultGrid
                        title="Road Sections in PMSDatabase"
                        data={results.distinctConflicts}
                    />

                    <ResultGrid
                        title="GPS Check"
                        data={results.filteredGPS}
                    />

                    <ResultGrid
                        title="Rut = 0"
                        data={results.noRut}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <ResultGrid
                        title="No Distresses Found"
                        data={results.noDistress}
                    />

                    <ResultGrid
                        title="IRI = 25"
                        data={results.IRI25}
                    />

                    <ResultGrid
                        title="No Macro Texture (MPD) Found"
                        data={results.noMPD}
                    />
                </div>
            </div>
        </div>
    );
}

function RideQualityChecker() {
    const [importType, setImportType] = useState("");

    const fieldcrewRef = useRef(null);
    const [fieldcrewSheet, setFieldcrewSheet] = useState("");
    const [selectedFieldcrewSheet, setSelectedFieldcrewSheet] = useState(null);

    const individualTestsRef = useRef(null);
    const [individualTestsText, setIndividualTestsText] = useState("");
    const [individualTestFiles, setIndividualTestFiles] = useState([]);

    const [rawPayAdjustments, setRawPayAdjustments] = useState([]);
    const [MPAdjustments, setMPAdjustments] = useState([]);

    const handleSheetChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setFieldcrewSheet(file.name);
        setSelectedFieldcrewSheet(file);
    }

    const handleIndividualTestsChange = (e) => {
        const files = Array.from(e.target.files);

        if (!files.length) return;

        setIndividualTestsText(`${files.length} files selected`);
        setIndividualTestFiles(files);
    }

    const importDynatest = async () => {
        function formatFieldCrewData(fieldcrewArr) {
            const formattedFieldCrew = fieldcrewArr
                .filter(row => {
                    const route = String(row["PAVEMENT MANAGEMENT AND TECHNOLOGY"] || "").trim();
                    return /^\d+[A-Za-z]?$/.test(route);
                })
                .map(row => {
                    // Parse comments before building row
                    const comments = row["__EMPTY_5"] || "";
                    const laneLoc = comments.indexOf("L");
                    const passLoc = comments.indexOf("P");
                    const LaneID = laneLoc !== -1 && passLoc !== -1 ? comments.substring(laneLoc, passLoc).trim() : "";
                    const PassNumber = passLoc !== -1 ? comments.substring(passLoc, passLoc + 2) : "";
                    const PassVideo = comments.includes("V") ? "Y" : "N";

                    // Format Route
                    let Route = String(row["PAVEMENT MANAGEMENT AND TECHNOLOGY"] || "").trim();
                    const lastChar = Route.slice(-1);

                    if (isNaN(lastChar)) {
                        const numericPart = Route.slice(0, -1);
                        Route = numericPart.padStart(3, "0") + lastChar;
                    } else {
                        Route = Route.padStart(3, "0");
                    }

                    // Handle Mileposts being in wrong order
                    let MPFrom = row["__EMPTY_1"];
                    let MPTo = row["__EMPTY_2"];

                    if (Number(MPFrom) > Number(MPTo)) {
                        [MPFrom, MPTo] = [MPTo, MPFrom];
                    }

                    return {
                        Route: Route,
                        Direction: row["__EMPTY"] ? row["__EMPTY"].substring(0, 1) : "",
                        MPFrom: MPFrom,
                        MPTo: MPTo,
                        CrewPosition: row["__EMPTY_3"],
                        FileName: row["__EMPTY_4"],
                        Comments: comments,
                        LaneID: LaneID,
                        PassNumber: PassNumber,
                        PassVideo: PassVideo,
                        Lat: null,
                        Long: null,
                    }
                });

            return { formattedFieldCrew };
        }

        function markClosestMilepost(rawData) {
            const gpsMap = new Map();

            rawData
                .filter(row => Number(row.F1) === 5280)
                .forEach(row => {
                    const key = `${row.F6}_${row.F7}`;

                    if (!gpsMap.has(key) || Number(row.F2) < gpsMap.get(key).MPFrom) {
                        gpsMap.set(key, {
                            MPFrom: Number(row.F2),
                            Lat: row.F6,
                            Long: row.F7,
                            ClosestMP: false
                        });
                    }
                });

            const tempGPS = [...gpsMap.values()];

            rawData
                .filter(row => Number(row.F1) === 5406)
                .forEach(interval => {
                    const intervalMP = Number(interval.F2);
                    let closest = null;
                    let minDist = Infinity;

                    for (const gps of tempGPS) {
                        const dist = Math.abs(gps.MPFrom - intervalMP);
                        if (dist < minDist) {
                            minDist = dist
                            closest = gps;
                        }
                    }

                    if (closest) closest.ClosestMP = true;
                });

            const nonGPSRows = rawData.filter(
                row => Number(row.F1) !== 5280
            );

            const closestGPSRows = tempGPS
                .filter(row => row.ClosestMP)
                .map(row => ({
                    F1: 5280,
                    F2: Number(row.MPFrom.toFixed(2)),
                    F6: row.Lat,
                    F7: row.Long
                }));

            return [...nonGPSRows, ...closestGPSRows];
        }

        function wRoundDown(value, digit) {
            if (String(value).includes(".")) {
                const expandedValue = Math.abs(value) * (10 ** digit);
                return Math.sign(value) * Math.trunc(expandedValue) / (10 ** digit);
            }

            return value;
        }

        function calcAvgIRI(rawAdjustments) {
            let n = 0; // count of good tests
            let i = 0; // sum of IRI value of good test
            let t = 0; // total lots with low speed

            for (const row of rawAdjustments) {
                n = 0;
                i = 0;

                if (row["AvgSpeedPass1"] >= 16) {
                    n = 1;
                    i = row["AvgPass1"];
                }

                if (row["AvgSpeedPass2"] >= 16) {
                    n += 1;
                    i += row["AvgPass2"];
                }

                if (row["AvgSpeedPass3"] >= 16) {
                    n += 1;
                    i += row["AvgPass3"];
                }

                if (n > 0) row["AvgIRI"] = wRoundDown(i / n, 0);

                if (n > 0 && n < 3) {
                    row["SpeedCorrApplied"] = true;
                    t += 1;
                } else if (n === 3) {
                    row["SpeedCorrApplied"] = false;
                } else if (n === 0) {
                    row["AvgIRI"] = 0;
                    row["SpeedCorrApplied"] = true;
                }
            }
        }

        function populationStdDev(rawAdjustments) {
            for (const row of rawAdjustments) {
                const values = [
                    row.AvgPass1,
                    row.AvgPass2,
                    row.AvgPass3
                ]
                    .filter(value => value != null && !isNaN(value))
                    .map(Number);

                if (values.length >= 2) {
                    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

                    const sumSqDiff = values.reduce((sum, value) => {
                        return sum + Math.pow(value - mean, 2);
                    }, 0);

                    const variance = sumSqDiff / values.length;

                    row.StdDev = Number(Math.sqrt(variance).toFixed(1));
                }
            }
        }

        function findOutlierInRecordset(rawAdjustments) {
            for (const row of rawAdjustments) {
                if (row.AvgPass1 == null || row.AvgPass2 == null || row.AvgPass3 == null) continue;

                const avg1 = Number(row.AvgPass1);
                const avg2 = Number(row.AvgPass2);
                const avg3 = Number(row.AvgPass3);

                const values = [avg1, avg2, avg3].sort((a, b) => a - b);
                const median = values[1];

                const diff1 = Math.abs(avg1 - median);
                const diff2 = Math.abs(avg2 - median);
                const diff3 = Math.abs(avg3 - median);

                let outlierPass;

                if (diff1 > diff2 && diff1 > diff3) {
                    outlierPass = "1";
                }
                else if (diff2 > diff1 && diff2 > diff3) {
                    outlierPass = "2";
                }
                else {
                    outlierPass = "3";
                }

                row.OutlierPass = outlierPass;
            }
        }

        function MPAdjustmentTableDynatest(rawPayAdjustment) {
            const mpAdjustments = [];
            let sectionID = 1;

            rawPayAdjustment.sort((a, b) =>
                a.Route.localeCompare(b.Route) ||
                a.Direction.localeCompare(b.Direction) ||
                a.LaneID.localeCompare(b.LaneID) ||
                Number(a.MPFrom) - Number(b.MPFrom)
            );

            let i = 0;
            while (i < rawPayAdjustment.length) {
                const first = rawPayAdjustment[i];

                const route = first.Route;
                const direction = first.Direction;
                const laneID = first.LaneID;

                let MPStart = Number(first.MPFrom);
                let MPEnd = Number(first.MPTo);

                // Build contiguous section
                while (i + 1 < rawPayAdjustment.length) {
                    const next = rawPayAdjustment[i + 1];
                    const gap = Number(next.MPFrom) - Number(rawPayAdjustment[i].MPFrom);

                    if (
                        next.Route === route &&
                        next.Direction === direction &&
                        next.LaneID === laneID &&
                        Number(gap.toFixed(2)) <= 0.5
                    ) {
                        MPEnd = Number(next.MPTo);
                        i++;
                    }
                    else {
                        break;
                    }
                }

                let existingSection = mpAdjustments.find(section =>
                    section.Route === route &&
                    section.Direction === direction &&
                    (
                        (MPStart >= section.MPStart && MPStart < section.MPEnd) ||
                        (MPEnd <= section.MPEnd && MPEnd > section.MPStart) ||
                        (MPStart <= section.MPStart && MPEnd >= section.MPEnd)
                    )
                );


                if (existingSection) {
                    sectionID = existingSection.SectionID;
                }
                else {
                    if (mpAdjustments.length > 0) {
                        sectionID =
                            Math.max(...mpAdjustments.map(x => x.SectionID)) + 1;
                    }
                }

                const duplicate = mpAdjustments.find(x =>
                    x.Route === route &&
                    x.LaneID === `${direction}-L${laneID}`
                );

                if (duplicate) throw new Error(`Duplicate LaneID Found - ${direction}-L${laneID} on Route ${route}`);

                const videoRow = rawPayAdjustment.find(row =>
                    row.Route === route &&
                    row.Direction === direction &&
                    row.LaneID === laneID &&
                    row.PassVideo === "Y" &&
                    row.MPFrom > MPStart &&
                    row.MPTo < MPEnd
                );

                const videoPassNum = videoRow?.PassNumber ?? -1;
                mpAdjustments.push({
                    Route: route,
                    Direction: direction,
                    LaneID: `${direction}-L${laneID}`,
                    MPStart,
                    MPEnd,
                    MPAdjustment: 0,
                    SectionID: sectionID,
                    VideoPassNum: videoPassNum,
                    AddedOn: new Date()
                });

                rawPayAdjustment.forEach(row => {
                    if (
                        row.Route === route &&
                        row.Direction === direction &&
                        row.LaneID === laneID &&
                        row.MPFrom >= MPStart &&
                        row.MPTo <= MPEnd
                    ) {
                        row.SectionID = sectionID;
                    }
                });

                i++;
            }

            return mpAdjustments;
        }

        let rawPayAdjustment = [];

        const data = await selectedFieldcrewSheet.arrayBuffer();
        const workbook = XLSX.read(data);
        const fieldcrewSheet = workbook.Sheets[workbook.SheetNames[0]];
        let jsonFieldcrew = XLSX.utils.sheet_to_json(fieldcrewSheet);

        const { formattedFieldCrew } = formatFieldCrewData(jsonFieldcrew);
        const distinctRoutes = [...new Set(formattedFieldCrew.map(row => row.Route))];

        const processedRawData = new Map();
        let startLimit = null;
        let endLimit = null;

        for (const route of distinctRoutes) {
            let firstPass = true;

            const routeRows = formattedFieldCrew
                .filter(row => row.Route === route)
                .sort((a, b) => {
                    return a.Route.localeCompare(b.Route)
                        || a.Direction.localeCompare(b.Direction)
                        || Number(a.MPFrom) - Number(b.MPFrom)
                });

            for (const row of routeRows) {
                // Find / Get file
                let fileName = row.FileName;
                let excelFile = individualTestFiles.find(
                    file => file.name.replace(".xlsb", "") === fileName
                );

                if (!excelFile) {
                    const correctedFileName = fileName.substring(0, 1) + route + fileName.slice(-2);
                    excelFile = individualTestFiles.find(
                        file => file.name.replace(".xlsb", "") === correctedFileName
                    );

                    if (excelFile) {
                        fileName = correctedFileName;
                        row.FileName = correctedFileName;
                    }
                }

                if (!excelFile) {
                    alert(`Could not find test file: ${fileName}`);
                    continue;
                }

                // Convert to json
                const data = await excelFile.arrayBuffer();
                const workbook = XLSX.read(data);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawData = XLSX.utils.sheet_to_json(worksheet, {
                    header: ["F1", "F2", "F3", "F4", "F5", "F6", "F7"],
                    defval: null
                });

                // Find closest milepost and filter data
                let filteredRawData = rawData.filter(row => ["5280", "5403", "5406"].includes(String(row.F1)));
                filteredRawData = markClosestMilepost(filteredRawData);
                filteredRawData.forEach(row => {
                    row.F2 = row.F2 != null ? Number(Number(row.F2).toFixed(2)) : row.F2;
                    row.F3 = row.F3 != null ? Number(Number(row.F3).toFixed(2)) : row.F3;
                });

                filteredRawData = filteredRawData.filter(row => Number(row.F1) === 5280 || Number(row.F2) !== Number(row.F3));
                filteredRawData.forEach(row => {
                    if (Number(row.F1) !== 5280 && Number(row.F2) > Number(row.F3)) {
                        [row.F2, row.F3] = [row.F3, row.F2];
                    }
                });

                // Set start / end limits
                const limitRows = filteredRawData.filter(row => Number(row.F1) === 5403);
                const currentStart = Math.min(...limitRows.map(row => Number(row.F2)));
                const currentEnd = Math.max(...limitRows.map(row => Number(row.F2)));

                if (firstPass) {
                    startLimit = currentStart;
                    endLimit = currentEnd;
                    firstPass = false;
                } else {
                    startLimit = Math.min(startLimit, currentStart);
                    endLimit = Math.max(endLimit, currentEnd);
                }

                processedRawData.set(fileName, {
                    Data: filteredRawData,
                    Route: route,
                    Direction: row.Direction,
                    LaneID: row.LaneID,
                    PassNumber: Number(row.PassNumber.replace("P", "")),
                    PassVideo: row.PassVideo
                });
            }

            const routeLanes = [
                ...new Map(
                    formattedFieldCrew
                        .filter(row => row.Route === route)
                        .map(row => [
                            `${row.Direction}_${row.LaneID}`,
                            {
                                Direction: row.Direction,
                                LaneID: row.LaneID
                            }
                        ])
                ).values()
            ];

            for (const lane of routeLanes) {
                for (let t = startLimit; t < endLimit; t += 0.01) {
                    rawPayAdjustment.push({
                        Route: route,
                        Direction: lane.Direction,
                        LaneID: lane.LaneID,
                        MPFrom: Number(t.toFixed(2)),
                        MPTo: Number((t + 0.01).toFixed(2))
                    });
                }
            }

            for (const importedFile of processedRawData.values()) {
                const {
                    Data,
                    Route,
                    Direction,
                    LaneID,
                    PassNumber
                } = importedFile;

                for (const row of Data) {
                    const adjustmentRow = rawPayAdjustment.find(adjustment =>
                        adjustment.Route === Route &&
                        adjustment.Direction === Direction &&
                        adjustment.LaneID === LaneID &&
                        Number(adjustment.MPFrom) === Number(row.F2)
                    );

                    if (!adjustmentRow) continue;

                    adjustmentRow.PassVideo = importedFile.PassVideo;
                    adjustmentRow.PassNumber = importedFile.PassNumber;

                    // Avg Speed
                    if (Number(row.F1) === 5403) adjustmentRow[`AvgSpeedPass${PassNumber}`] = row.F4;

                    // Left / Right / Avg IRI
                    if (Number(row.F1) === 5406) {
                        adjustmentRow[`LeftPass${PassNumber}`] = row.F6;
                        adjustmentRow[`RightPass${PassNumber}`] = row.F4;
                        adjustmentRow[`AvgPass${PassNumber}`] = (Number(row.F4) + Number(row.F6)) / 2;
                    }

                    if (Number(row.F1) === 5280) {
                        adjustmentRow[`LatPass${PassNumber}`] = row.F6;
                        adjustmentRow[`LonPass${PassNumber}`] = row.F7;
                    }
                }
            }
        }

        // Remove rows where avg speed passes = 0
        rawPayAdjustment = rawPayAdjustment.filter(row =>
            !(
                Number(row.AvgSpeedPass1) === 0 &&
                Number(row.AvgSpeedPass2) === 0 &&
                Number(row.AvgSpeedPass3) === 0
            ) &&
            !(
                row.AvgSpeedPass1 == null &&
                row.AvgSpeedPass2 == null &&
                row.AvgSpeedPass3 == null
            )
        );

        rawPayAdjustment.forEach(row => {
            row.Direction = row.Direction.toUpperCase();
        });

        calcAvgIRI(rawPayAdjustment);
        populationStdDev(rawPayAdjustment);
        findOutlierInRecordset(rawPayAdjustment);

        const mpAdjustments = MPAdjustmentTableDynatest(rawPayAdjustment);

        alert("Raw Data Imported Successfully");

        setRawPayAdjustments(rawPayAdjustment);
        setMPAdjustments(mpAdjustments);
    };

    const handleImport = async (e) => {
        if (importType === "Dynatest" && (!selectedFieldcrewSheet || individualTestFiles.length == 0)) {
            alert("Please select both Fieldcrew Worksheet and Individual Test Files."); // Shouldn't ever happen since import is disabled without
            return;
        } else if (importType === "Pathway" && !selectedFieldcrewSheet) {
            alert("Please select a Fieldcrew Wokrsheet."); // Shouldn't ever happen since import is disabled without
            return;
        }

        if (importType === "Dynatest") {
            await importDynatest();
        } else {
            alert("Don't have Pathway yet.")
            return;
        }

        setRawPayAdjustments(prev =>
            prev.map(row => {
                if (row.AvgSpeedPass1 != null && Number(row.AvgSpeedPass1) < 16) {
                    row.LeftPass1 = null;
                    row.RightPass1 = null;
                    row.AvgPass1 = null;
                }

                if (row.AvgSpeedPass2 != null && Number(row.AvgSpeedPass2) < 16) {
                    row.LeftPass2 = null;
                    row.RightPass2 = null;
                    row.AvgPass2 = null;
                }

                if (row.AvgSpeedPass3 != null && Number(row.AvgSpeedPass3) < 16) {
                    row.LeftPass3 = null;
                    row.RightPass3 = null;
                    row.AvgPass3 = null;
                }

                return row;
            })
        );

        console.log(rawPayAdjustments);
        console.log(MPAdjustments);
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-black w-24">
                    Test Vehicle:
                </label>

                <select
                    value={importType}
                    onChange={(e) => {
                        setImportType(e.target.value);
                        setFieldcrewSheet("");
                        setSelectedFieldcrewSheet(null);
                        setIndividualTestsText("");
                        setIndividualTestFiles([]);
                    }}
                    className="w-32 h-8 border border-gray-500 rounded px-2 bg-white text-sm text-black"
                >
                    <option value="">Select a vehicle</option>
                    <option value="Pathway">Pathway</option>
                    <option value="Dynatest">Dynatest</option>
                </select>
            </div>

            {/* Fieldcrew Sheet */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-black w-16">
                    File:
                </label>

                <div className="flex items-center gap-2 flex-1">
                    <span className="w-64 h-8 border border-gray-500 rounded px-2 flex items-center bg-white text-sm text-black">
                        {fieldcrewSheet || "No files selected"}
                    </span>

                    <button
                        type="button"
                        onClick={() => fieldcrewRef.current.click()}
                        className="bg-blue-500 text-white px-4 h-8 rounded hover:bg-blue-600"
                    >
                        Browse
                    </button>

                    <button
                        type="button"
                        onClick={handleImport}
                        className="bg-blue-500 text-white px-4 h-8 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={
                            (importType === "Dynatest" && (!selectedFieldcrewSheet || individualTestFiles.length === 0)) ||
                            (importType === "Pathway" && !selectedFieldcrewSheet)
                        }
                    >
                        Import
                    </button>

                    <input
                        ref={fieldcrewRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleSheetChange}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Individual Test Files */}
            {importType === "Dynatest" &&
                <div className="flex items-center gap-3">
                    <label className="text-sm font-bold text-black w-16">
                        Tests:
                    </label>

                    <div className="flex items-center gap-2 flex-1">
                        <span className="w-64 h-8 border border-gray-500 rounded px-2 flex items-center bg-white text-sm text-black">
                            {individualTestsText || "No files selected"}
                        </span>

                        <button
                            type="button"
                            onClick={() => individualTestsRef.current.click()}
                            className="bg-blue-500 text-white px-4 h-8 rounded hover:bg-blue-600"
                        >
                            Browse
                        </button>

                        <input
                            ref={individualTestsRef}
                            type="file"
                            accept=".xlsx,.xls,.xlsb"
                            multiple
                            onChange={handleIndividualTestsChange}
                            className="hidden"
                        />
                    </div>
                </div>
            }
        </div>
    );
}