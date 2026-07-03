import { getEquipmentTables, insertNewEquipment, updateExistingEquipment, insertNewIssue, updateExistingIssue } from "../utils/supabase/queries";
import { useQuery } from '@tanstack/react-query'

import React, {useEffect, useState, useMemo} from 'react';

export default function test() {
    const tabs = [
        { id: "equipQA", label: "Equipment QA Assurance", content: "Equipment QA"},
        { id: "dataIssues", label: "Data Collection Issues", content: "Data"}
    ];
    
    const [activeTab, setActiveTab] = useState(tabs[0].id);
    // const [lookups, setLookups] = useState({
    //     verification: [],
    //     equipmentType: [],
    //     equipmentName: [],
    //     certType: [],
    //     users: [],
    //     certNames: [],
    //     QACerts: [],
    //     status: [],
    //     priority: [],
    //     issueCategories: [],
    //     issueEquipmentName: [],
    //     collectionTask: [],
    //     issueList: []
    // });

    const {
        data: lookups,
        isLoading,
        isError
    } = useQuery({
        queryKey: ['equipmentTables'],
        queryFn: getEquipmentTables
    });

    // useEffect(() => {
    //     async function load() {
    //         const data = await getEquipmentTables();
    //         setLookups(data)
    //     }

    //     load();
    // }, []);

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

            {/* Equipment QA Form */}
            <div className="bg-[#D1EAF0] w-full h-full overflow-y-auto">
                {activeTab === "equipQA" && <EquipmentQAForm lookups={lookups} />}
                {activeTab === "dataIssues" && <DataIssuesForm lookups={lookups} />}
            </div>
        </div>
    );
}

function EquipmentQAForm({ lookups }) {
    const [certificationType, setCertificationType] = useState("");
    const [equipmentType, setEquipmentType] = useState("");
    const [equipmentName, setEquipmentName] = useState("");
    const [verificationResult, setVerificationResult] = useState("Pending");
    const [verificationFilter, setVerificationFilter] = useState("");
    const [selectedCertifications, setSelectedCertifications] = useState([]);
    const [recordType, setRecordType] = useState("New Record");
    const [createdBy, setCreatedBy] = useState("");
    const [dateRecord, setDateRecord] = useState("");
    const [dateCert, setDateCert] = useState("");
    const [comments, setComments] = useState("");
    const [QAID, setQAID] = useState("");

    const filteredQACerts = lookups?.QACerts.filter(item => {
        const itemDate = item["Created On"]?.split("T")[0];

        const matchDate = !dateRecord || itemDate === dateRecord;
        const matchCreatedBy = !createdBy || item["Created By"] === createdBy;
        const matchVerification =
            !verificationFilter || item["Verification Result"] === verificationFilter;

        return matchDate && matchCreatedBy && matchVerification;
    });

    const uniqueCreatedBy = [
        ...new Set(lookups?.QACerts.map(item => item["Created By"]))
    ];

    const uniqueCreatedOn = [
        ...new Set(lookups?.QACerts.map(item => item["Created On"].split("T")[0]))
    ];

    const handleSubmit = async () => {
        const payload = {
            certificationType,
            equipmentName,
            equipmentType,
            verificationResult,
            dateCert,
            comments,
            certifications: selectedCertifications,
            Existing_QAID: QAID
        };
        
        // try {
        //     const res = await fetch(`${API}/api/verificationResult/upload-qa`, {
        //         method: "POST",
        //         headers: {
        //             "Content-Type": "application/json"
        //         },
        //         body: JSON.stringify(payload)
        //     });

        //     const data = await res.json();
        //     alert(data.message);
        // } catch (err) {
        //     console.error("Submit error:", err);
        // }
        
        const res = recordType === "New Record" ? await insertNewEquipment(payload) : await updateExistingEquipment(payload);

        alert(res.message);
    };

    return(
        <form className='text-black p-6 w-full max-w-6xl mx-auto'>
            <div className="w-36 mb-8">
                <label className="block text-sm mb-1 font-bold">
                    Record Type
                </label>
                <select className="w-full border p-2 rounded bg-white" onChange={(e) => {
                    setRecordType(e.target.value)

                    setCertificationType("")
                    setEquipmentName("")
                    setEquipmentType("")
                    setVerificationResult("")
                    setDateCert("")
                    setComments("")
                    setCreatedBy("")
                    setDateRecord("")
                    setVerificationFilter("")
                }}>
                    <option>New Record</option>e
                    <option>Existing Record</option>
                </select>
            </div>
            
            {/* Filters */}
            {recordType === "Existing Record" && (
                <fieldset className="border-2 border-red-500 rounded-lg p-4 mb-6">
                    <legend className="px-2 font-bold text-red-500">
                        Filter Options
                    </legend>

                    <div className="mb-4">
                        <label className="block text-sm mb-1 font-bold">
                            QA ID
                        </label>
                        <select value={QAID}
                        onChange={(e) => {
                            const QAID = e.target.value;
                            setQAID(e.target.value);

                            const record = lookups?.QACerts.find(
                                item => item.QAID === QAID
                            );

                            if (!record) return;
                            
                            if (record["Certification Type"] === "Equipment Verification") {
                                setCertificationType("Equipment");
                            } else {
                            setCertificationType(record["Certification Type"]);
                        }

                            setEquipmentName(record["Equipment Name"]);
                            setEquipmentType(record["Equipment Type"]);
                            setSelectedCertifications([record["Certification Name"]]);
                            
                            if (record["Verification Result"] === null) {
                                setVerificationResult("");
                                setVerificationFilter("");
                            } else {
                                setVerificationResult(record["Verification Result"]);
                                setVerificationFilter(record["Verification Result"]);
                            }
                            setCreatedBy(record["Created By"]);
                            setDateRecord(record["Created On"].split("T")[0]);
                            setDateCert(record["Date Certification"].split("T")[0]);
                            setComments(record["Comments"]);
                        }}
                        className={`w-full border p-2 rounded bg-white`}>
                            <option>-- Select --</option>

                            {filteredQACerts.slice().sort((a, b) => b.QAID.localeCompare(a.QAID)).map((item, index) => (
                                <option key={`QA-${index}`} value={item.QAID}>
                                    {item.QAID} | {item["Certification Type"]} | {item["Certification Name"]} | {item["Created On"].split("T")[0]} | {item["Verification Result"]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <div>
                            <label className="block text-sm mb-1 font-bold">
                                Created By
                            </label>
                            <select value={createdBy} onChange={(e) => {
                                setCreatedBy(e.target.value);

                                setCertificationType("")
                                setEquipmentName("")
                                setEquipmentType("")
                                setVerificationResult("")
                                setDateCert("")
                                setComments("")
                            }} className={`w-full border p-2 rounded bg-white`}>
                                <option value="">-- Select --</option>

                                {uniqueCreatedBy.map((user, index) => (
                                    <option key={`createdBy-${index}`} value={user}>
                                        {user}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1 font-bold">
                                Date Record
                            </label>
                            <select value={dateRecord} onChange={(e) => {
                                setDateRecord(e.target.value);

                                setCertificationType("")
                                setEquipmentName("")
                                setEquipmentType("")
                                setVerificationResult("")
                                setDateCert("")
                                setComments("")
                            }} className={`w-full border p-2 rounded bg-white`}>
                                <option value="">-- Select --</option>

                                {uniqueCreatedOn.map((user, index) => (
                                    <option key={`createdBy-${index}`} value={user}>
                                        {user}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1 font-bold">
                                Verification Result
                            </label>
                            <select value={verificationFilter} onChange={(e) => {
                                setVerificationFilter(e.target.value);

                                setCertificationType("")
                                setEquipmentName("")
                                setEquipmentType("")
                                setVerificationResult("")
                                setDateCert("")
                                setComments("")
                            }} className={`w-full border p-2 rounded bg-white`}>
                                <option value="">-- Select --</option>

                                {lookups?.verification.map((item, index) => (
                                    <option key={`verification-${index}`} value={item["Verification Result"]}>
                                        {item["Verification Result"]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>
            )}

            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                {/* Left column */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm mb-1 font-bold">
                            Certification Type
                        </label>
                        <select value={certificationType} onChange={(e) => {
                            setCertificationType(e.target.value)

                            setEquipmentName("")
                            setEquipmentType("")
                        }} className={`w-full border p-2 rounded bg-white ${(recordType === "New Record") ? "" : "opacity-50 cursor-not-allowed"}`} disabled={recordType === "New Record" ? false : true}>
                            <option>-- Select --</option>

                            {lookups?.certType.map((item, index) => (
                                <option key={`cert-${index}`} value={item["Certification Type"]}>
                                    {item["Certification Type"]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 font-bold">
                            Equipment Type
                        </label>
                        <select value={equipmentType} onChange={(e) => setEquipmentType(e.target.value)} disabled={(certificationType !== "Equipment" && recordType === "New Record") || (recordType === "Existing Record")} 
                        className={`w-full border p-2 rounded bg-white ${certificationType === "" || certificationType === "-- Select --" || certificationType === "Personnel" || recordType === "Existing Record" ? "opacity-50 cursor-not-allowed" : ""}`}>
                            <option value="">-- Select --</option>

                            {(recordType === "New Record") ? lookups?.equipmentType.map((item, index) => (
                                <option key={`equipmentType-${index}`} value={item["Equipment Type"]}>
                                    {item["Equipment Type"]}
                                </option>
                            )) :
                            <option>{equipmentType}</option>}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 font-bold">
                            Certification Names
                        </label>
                        <select
                            multiple 
                            value={selectedCertifications}
                            onChange={(e) => {
                                const options = Array.from(e.target.selectedOptions);
                                setSelectedCertifications(options.map(opt => opt.value));
                            }}
                            className={`w-full border p-2 rounded bg-white h-54.5 ${recordType === "Existing Record" ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={(recordType === "New Record") ? false : true}
                        > {/*where [Certification Type] = 'Equipment' And Discontinued = 0;*/}
                            {lookups?.certNames
                            .filter(item => {
                                if (certificationType === "" || certificationType === "-- Select --") return false;

                                return(
                                    item["Certification Type"] === certificationType && 
                                    item["Discontinued"] === 0 &&
                                    (
                                        certificationType !== "Equipment" || equipmentType === "-- Select --" || equipmentType === "Personnel" ||
                                        item[equipmentType] === 1
                                    )
                                );
                            })
                            .map((item, index) => (
                                <option key={`certNames-${index}`} value={item["Certification Names"]}>
                                {item["Certification Names"]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm mb-1 font-bold">
                            {(certificationType === "Equipment") ? "Equipment Name" : "Employee Name"}
                        </label>
                        <select value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} disabled={certificationType === "" || certificationType === "-- Select --" || recordType === "Existing Record"} 
                        className={`w-full border p-2 rounded bg-white ${certificationType === "" || certificationType === "-- Select --" || recordType === "Existing Record" ? "opacity-50 cursor-not-allowed" : ""}`}>
                            <option value="">-- Select --</option>
                            
                            {recordType === "Existing Record" ? <option>{equipmentName}</option> : certificationType === "Equipment" ? 
                            lookups?.equipmentName.map((item, index) => (
                                <option key={`equipmentName-${index}`} value={item["Equipment Name"]}>
                                    {item["Equipment Name"]}
                                </option>
                            ))
                            : lookups?.users.map((item, index) => (
                                <option key={`userName-${index}`} value={item["UserName"]}>
                                    {item["UserName"]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 font-bold">
                            Update Verification Result
                        </label>
                        <select value={verificationResult} onChange={(e) => setVerificationResult(e.target.value)} className="w-full border p-2 rounded bg-white">
                            <option value="">-- Select --</option>

                            {lookups?.verification.map((item, index) => (
                                <option key={`verification-${index}`} value={item["Verification Result"]}>
                                    {item["Verification Result"]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 font-bold">
                            Date Certification
                        </label>
                        <input type="date" value={dateCert} onChange={(e) => setDateCert(e.target.value)} className="w-full border p-2 rounded bg-white" />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 font-bold">
                            Comments
                        </label>
                        <textarea value={comments} onChange={(e) => setComments(e.target.value)} className="w-full border p-2 rounded h-32 bg-white" />
                    </div>
                </div>
            </div>

            {/* Button */}
            <div className="mt-8 flex justify-center">
                <button type="button" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600" onClick={handleSubmit}>
                    {recordType === "New Record" ? "Create Record" : "Update Record"}
                </button>
            </div>
        </form>
    );
}

function DataIssuesForm({ lookups }) {
    const [category, setCategory] = useState("");
    const [status, setStatus] = useState("");
    const [closedDate, setClosedDate] = useState("");
    const [equipmentName, setEquipmentName] = useState("");
    const [followUp, setFollowUp] = useState("");
    const [recordType, setRecordType] = useState("New Record");
    const [collectionTask, setCollectionTask] = useState("");
    const [priority, setPriority] = useState("");
    const [comments, setComments] = useState("");
    const [assigned, setAssigned] = useState("");
    const [IssueID, setIssueID] = useState("");

    const [reportedBy, setReportedBy] = useState("");
    const [reportedDate, setReportedDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const filteredIssueList = lookups?.issueList.filter(item => {
        const itemDate = item["ReportedDate"]?.split("T")[0];

        const matchDate = !reportedDate || itemDate === reportedDate;
        const matchReportedBy = !reportedBy || item["ReportedBy"] === reportedBy;
        const matchStatus =
            !statusFilter || item["Status"] === statusFilter;

        return matchDate && matchReportedBy && matchStatus;
    });

    const uniqueReportedBy = [
        ...new Set(lookups?.issueList
            .filter(item => item.ReportedBy !== null)
            .map(item => item["ReportedBy"]))
    ];

    const uniqueReportedDate = [
        ...new Set(lookups?.issueList
            .map(item => item["ReportedDate"].split("T")[0]))
    ];

    const uniqueCategories = [
        ...new Set(lookups?.issueCategories
            .filter(item => item.Discontinued === 0)
            .map(item => item["Category"]))
    ];

    const uniqueFollowUps = [
        ...new Set(lookups?.issueCategories
            .filter(item => item.FollowUp !== null)
            .map(item => item["FollowUp"]))
    ];

    const assignedUserOptions = useMemo(() => {
        const users = lookups?.users ?? [];

        return [...new Set([
            ...users.map(u => u.UserName),
            assigned,
        ])].filter(Boolean);
    }, [lookups?.users, assigned]);

    const handleSubmit = async () => {
        const payload = {
            category,
            status,
            closedDate,
            equipmentName,
            followUp,
            recordType,
            collectionTask,
            priority,
            comments,
            assigned,
            IssueID
        };
        
        // try {
        //     const res = await fetch(`${API}/api/verificationResult/upload-issue`, {
        //         method: "POST",
        //         headers: {
        //             "Content-Type": "application/json"
        //         },
        //         body: JSON.stringify(payload)
        //     });

        //     const data = await res.json();
        //     alert(data.message);
        // } catch (err) {
        //     console.error("Submit error:", err);
        // }

        const res = recordType === "New Record" ? await insertNewIssue(payload) : await updateExistingIssue(payload);

        alert(res.message);
    };

    return (
        <form className='text-black p-6 w-full max-w-6xl mx-auto'>
            <div className="w-36 mb-8">
                <label className="block text-sm mb-1 font-bold">
                    Record Type
                </label>
                <select value={recordType} onChange={(e) => {
                    setRecordType(e.target.value);
                    
                    setCategory("");
                    setCollectionTask("");
                    setEquipmentName("");
                    setStatus("");
                    setFollowUp("");
                    setClosedDate("");
                    setCollectionTask("");
                    setPriority("");
                    setAssigned("");
                    setComments("");
                }} className="w-full border p-2 rounded bg-white">
                    <option>New Record</option>
                    <option>Existing Record</option>
                </select>
            </div>

            {/* Filters */}
            {recordType === "Existing Record" && (
                <fieldset className="border-2 border-red-500 rounded-lg p-4 mb-6">
                    <legend className="px-2 font-bold text-red-500">
                        Filter Options
                    </legend>

                    <div className="mb-4">
                        <label className="block text-sm mb-1 font-bold">
                            Collection Issue ID
                        </label>
                        <select value={IssueID}
                        onChange={(e) => {
                            const IssuesID = e.target.value;
                            setIssueID(IssuesID);

                            const record = lookups?.issueList.find(
                                item => item.IssuesID === IssuesID
                            );

                            if (!record) return;
                            
                            setCategory(record["Category"]);
                            setAssigned(record["AssignedTo"]);
                            setFollowUp(record["Follow Up"]);
                            setCollectionTask(record["Data Collection Task"]);
                            setStatus(record["Status"]);
                            setClosedDate(record["ClosedDate"] ? record["ClosedDate"].split("T")[0] : "");
                            setEquipmentName(record["Equipment Name"]);
                            setPriority(record["Priority"]);
                            setComments(record["Comments"]);
                        }}
                        className={`w-full border p-2 rounded bg-white`}>
                            <option value="">-- Select --</option>

                            {filteredIssueList.slice().sort((a, b) => b.IssuesID.localeCompare(a.IssuesID)).map((item, index) => (
                                <option key={`Issue-${index}`} value={item.IssuesID}>
                                    {item.IssuesID} | {item["Category"]} | {item["Data Collection Task"]} | {item["ReportedDate"].split("T")[0]} | {item["Status"]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <div>
                            <label className="block text-sm mb-1 font-bold">
                                Reported By
                            </label>
                            <select value={reportedBy} onChange={(e) => {
                                setReportedBy(e.target.value);
                                setIssueID("");
                            }} className={`w-full border p-2 rounded bg-white`}>
                                <option value="">-- Select --</option>

                                {uniqueReportedBy.map((user, index) => (
                                    <option key={`reportedBy-${index}`} value={user}>
                                        {user}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1 font-bold">
                                Reported Date
                            </label>
                            <select value={reportedDate} onChange={(e) => {
                                setReportedDate(e.target.value);
                                setIssueID("");
                            }} className={`w-full border p-2 rounded bg-white`}>
                                <option value="">-- Select --</option>

                                {uniqueReportedDate.map((date, index) => (
                                    <option key={`reportedDate-${index}`} value={date}>
                                        {date}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1 font-bold">
                                Current Status
                            </label>
                            <select value={statusFilter} onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setIssueID("");
                            }} className={`w-full border p-2 rounded bg-white`}>
                                <option value="">-- Select --</option>

                                {lookups?.status.map((item, index) => (
                                    <option key={`status-${index}`} value={item["Status"]}>
                                        {item["Status"]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>
            )}

            {/* Fields */}
            <div className="grid grid-cols-3 gap-x-12 gap-y-6">
                {/* First row */}
                <div className="space-y-6">
                    <label className="block text-sm mb-1 font-bold">
                        Category
                    </label>
                    <select value={category} onChange={(e) => {
                        const value = e.target.value
                        setCategory(value);

                        if (value === "Weather" || value === "Weekend/Holiday") {
                            setStatus("Closed");
                            setClosedDate(new Date().toISOString().split("T")[0]);
                            setEquipmentName("Other");
                        } else if (value === "Personnel") {
                            setEquipmentName("Other");
                        } else {
                            setStatus("");
                            setClosedDate("");
                            setEquipmentName("");
                        }
                        
                        (value === "Computer" || value === "Vehicle/Equipment") ? setFollowUp("Needed") : setFollowUp("Not Needed");
                    }} className={`w-full border p-2 rounded bg-white ${recordType === "Existing Record" ? "opacity-50 cursor-not-allowed" : ""}`} disabled={recordType === "Existing Record" ? true : false}>
                        <option value="">-- Select --</option>

                        {recordType === "New Record" ? uniqueCategories.map((category, index) => (
                            <option key={`category-${index}`} value={category}>
                                {category}
                            </option>
                        )) : 
                        <option>{category}</option>}
                    </select>
                </div>

                <div className="space-y-6">
                    <label className="block text-sm mb-1 font-bold">
                        Assigned To
                    </label>
                    <select value={assigned} onChange={(e) => {
                        setAssigned(e.target.value);
                    }} className={`w-full border p-2 rounded bg-white`}>
                        <option value="">-- Select --</option>

                        {recordType === "New Record" ? lookups?.users.map((item, index) => (
                            <option key={`userName-${index}`} value={item.UserName}>
                                {item.UserName}
                            </option>
                        )) : 
                        assignedUserOptions.map((item, index) => (
                            <option key={`userName-${index}`} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-6">
                    <label className="block text-sm mb-1 font-bold">
                        Follow Up
                    </label>
                    <select value={followUp} onChange={(e) => {
                        setFollowUp(e.target.value);
                    }} className={`w-full border p-2 rounded bg-white`}>
                        <option value="">-- Select --</option>

                        {uniqueFollowUps.map((followUp, index) => (
                            <option key={`follow-${index}`} value={followUp}>
                                {followUp}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Second row */}
                <div className="space-y-6">
                    <label className="block text-sm mb-1 font-bold">
                        Data Collection Task
                    </label>
                    <select value={collectionTask} onChange={(e) => {
                        setCollectionTask(e.target.value);
                    }} className={`w-full border p-2 rounded bg-white ${recordType === "Existing Record" ? "opacity-50 cursor-not-allowed" : ""}`} disabled={recordType === "Existing Record" ? true : false}>
                        <option value="">-- Select --</option>

                        {recordType === "New Record" ? lookups?.collectionTask.map((item, index) => (
                            <option key={`task-${index}`} value={item["Collection Task Type"]}>
                                {item["Collection Task Type"]}
                            </option>
                        )) :
                        <option>{collectionTask}</option>}
                    </select>
                </div>

                <div className="space-y-6">
                    <label className="block text-sm mb-1 font-bold">
                        Status Update
                    </label>
                    <select value={status} onChange={(e) => {
                        setStatus(e.target.value);
                    }} className={`w-full border p-2 rounded bg-white`}>
                        <option value="">-- Select --</option>

                        {lookups?.status.map((item, index) => (
                            <option key={`status-${index}`} value={item["Status"]}>
                                {item["Status"]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-6">
                    <label className="block text-sm mb-1 font-bold">
                        Closed Date
                    </label>
                    <input type="date" value={closedDate} onChange={(e) => setClosedDate(e.target.value)} className="w-full border p-2 rounded bg-white" />
                </div>

                {/* Third row */}
                <div className="space-y-6">
                    <label className="block text-sm mb-1 font-bold">
                        Equipment Name
                    </label>
                    <select value={equipmentName} onChange={(e) => {
                        setEquipmentName(e.target.value);
                    }} className={`w-full border p-2 rounded bg-white ${recordType === "Existing Record" ? "opacity-50 cursor-not-allowed" : ""}`} disabled={recordType === "Existing Record" ? true : false}>
                        <option value="">-- Select --</option>

                        {recordType === "New Record" ? lookups?.issueEquipmentName.map((item, index) => (
                            <option key={`equipmentName-${index}`} value={item["Equipment Name"]}>
                                {item["Equipment Name"]}
                            </option>
                        )) :
                        <option>{equipmentName}</option>}
                    </select>
                </div>
                
                <div className="space-y-6">
                    <label className="block text-sm mb-1 font-bold">
                        Priority
                    </label>
                    <select value={priority} onChange={(e) => {
                        setPriority(e.target.value);
                    }} className={`w-full border p-2 rounded bg-white ${recordType === "Existing Record" ? "opacity-50 cursor-not-allowed" : ""}`} disabled={recordType === "Existing Record" ? true : false}>
                        <option value="">-- Select --</option>

                        {recordType === "New Record" ? lookups?.priority.map((item, index) => (
                            <option key={`priority-${index}`} value={item.Priority}>
                                {item.Priority}
                            </option>
                        )) : 
                        <option>{priority}</option>}
                    </select>
                </div>
            </div>

            <div className="mt-4">
                <label className="block text-sm mb-1 font-bold">
                    Comments
                </label>
                <textarea value={comments} onChange={(e) => {setComments(e.target.value)}} className="w-180 border p-2 rounded h-32 bg-white" />
            </div>

            {/* Button */}
            <div className="mt-8 flex justify-center">
                <button type="button" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600" onClick={handleSubmit}>
                    {recordType === "New Record" ? "Create Record" : "Update Record"}
                </button>
            </div>
        </form>
    );
}