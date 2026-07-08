import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query'

import {
    getReportsData, getUserMilesBreakdown, getDetailedReport, getAssignmentData, assignMiles, removeMileage,
    getAssignedReviews, getReason, getReasonQuery, getReviewComments, getSDI, insertTenthMileReview, updateQASection, queryUserTracking, updateTenthMileReview, queryReasonCodePM, insertElevatedSection
} from "../utils/supabase/qareview-queries";

import { RechartsDevtools } from '@recharts/devtools'
import { BarChart, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer, Legend, LabelList } from 'recharts';

import { AgGridReact } from 'ag-grid-react';

export default function qareview() {
    const tabs = [
        { id: "reports", label: "Reports" },
        { id: "assignment", label: "QA Assignment" },
        { id: "review", label: "QA Review" }
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
                {activeTab === "reports" && <ReportsForm />}
                {activeTab === "assignment" && <AssignmentForm />}
                {activeTab === "review" && <ReviewForm />}
            </div>
        </div>
    );
}

function ReportsForm() {
    const [selectedYear, setSelectedYear] = useState(2025)
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [userBreakdown, setUserBreakdown] = useState([]);
    const [showReport, setShowReport] = useState(false);
    const [detailedReport, setDetailedReport] = useState([]);

    const {
        data: reportsData,
        isLoading,
        isError
    } = useQuery({
        queryKey: ['reportsData'],
        queryFn: getReportsData
    });

    // Assignments filtered for data year
    const filteredAssignments = Object.values(
        (reportsData?.assignedReviews ?? [])
            .filter((item) => Number(item?.DataYear) === selectedYear)
            .reduce((acc, item) => {

                const reason = item?.ReasonName;
                const status = item?.ReviewStatus;
                const miles = Number(item?.AssignedMiles);

                if (!acc[reason]) {
                    acc[reason] = { category: reason };
                }

                if (!acc[reason][status]) {
                    acc[reason][status] = 0;
                }

                acc[reason][status] = miles;

                return acc;
            }, {})
    ).sort((a, b) => a.category.localeCompare(b.category));

    // Review Actions filtered for data year
    const filteredReviewActions = Object.values(
        (reportsData?.reviewActions ?? [])
            .filter((item) => Number(item?.DataYear) === 2025)
            .reduce((acc, item) => {

                const reason = item?.ReasonName;
                const action = item?.ReviewAction;
                const miles = Number(item?.Miles);

                if (!acc[reason]) {
                    acc[reason] = { category: reason };
                }

                if (!acc[reason][action]) {
                    acc[reason][action] = 0;
                }

                acc[reason][action] = miles;

                return acc;
            }, {})
    ).sort((a, b) => a.category.localeCompare(b.category));

    // Distress Reviews
    const distressReviews = reportsData?.distressReviews || [];

    const distressData = [
        { name: "Pattern", "TooLow": 0, "SlightlyLow": 0, "Acceptable": 0, "SlightlyHigh": 0, "TooHigh": 0 },
        { name: "WheelPath_Pattern", "TooLow": 0, "SlightlyLow": 0, "Acceptable": 0, "SlightlyHigh": 0, "TooHigh": 0 },
        { name: "Longitudinal", "TooLow": 0, "SlightlyLow": 0, "Acceptable": 0, "SlightlyHigh": 0, "TooHigh": 0 },
        { name: "WheelPath_Longitudinal", "TooLow": 0, "SlightlyLow": 0, "Acceptable": 0, "SlightlyHigh": 0, "TooHigh": 0 },
        { name: "Transverse", "TooLow": 0, "SlightlyLow": 0, "Acceptable": 0, "SlightlyHigh": 0, "TooHigh": 0 },
    ];

    distressData.forEach(row => {
        const filteredData = distressReviews.filter(item => item.DataYear === selectedYear);

        row.TooLow = Math.round(filteredData.filter(r => r[row.name] === "Too Low").length / filteredData.length * 100) / 100;
        row.SlightlyLow = Math.round(filteredData.filter(r => r[row.name] === "Slightly Low").length / filteredData.length * 100) / 100;
        row.Acceptable = Math.round(filteredData.filter(r => r[row.name] === "Acceptable").length / filteredData.length * 100) / 100;
        row.SlightlyHigh = Math.round(filteredData.filter(r => r[row.name] === "Slightly High").length / filteredData.length * 100) / 100;
        row.TooHigh = Math.round(filteredData.filter(r => r[row.name] === "Too High").length / filteredData.length * 100) / 100;
    });

    // Miles reviewed
    const milesReviewed = (reportsData?.milesReviewed ?? []).filter(item => item.DataYear === selectedYear)[0];

    async function handleUserBreakdown() {
        const data = await getUserMilesBreakdown(selectedYear);

        setUserBreakdown(data);
        setShowBreakdown(true);
    }

    async function handleDetailedReport() {
        const data = await getDetailedReport(selectedYear);

        setDetailedReport(data);
        setShowReport(true);
    }

    return (
        <>
            {showBreakdown && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowBreakdown(false)}>
                    <div className="bg-white w-[50%] h-[65%] p-8 rounded shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between mb-2">
                            <h2 className="text-xl font-bold text-black ml-1">User Mile Breakdown</h2>

                            <button onClick={() => setShowBreakdown(false)} className="p-2 rounded bg-red-500 hover:bg-red-700 text-white font-bold mb-4">
                                Close View
                            </button>
                        </div>

                        {/* User Mile Breakdown sheet */}
                        <div className="ag-theme-alpine w-full h-[90%]">
                            <AgGridReact
                                rowData={userBreakdown}
                                columnDefs={[
                                    { field: "UserName", sort: "asc", filter: true },
                                    {
                                        field: "MilesAssigned",
                                        valueFormatter: params =>
                                            params.value != null ? Number(params.value).toFixed(2) : ""
                                    },
                                    {
                                        field: "MilesCompleted",
                                        valueFormatter: params =>
                                            params.value != null ? Number(params.value).toFixed(2) : ""
                                    },
                                    {
                                        field: "MilesOutstanding",
                                        valueFormatter: params =>
                                            params.value != null ? Number(params.value).toFixed(2) : ""
                                    },
                                    {
                                        field: "MilesOverDue",
                                        valueFormatter: params =>
                                            params.value != null ? Number(params.value).toFixed(2) : ""
                                    },
                                    {
                                        field: "MilesNotAssigned",
                                        valueFormatter: params =>
                                            params.value != null ? Number(params.value).toFixed(2) : ""
                                    }
                                ]}
                                pagination={true}
                                paginationPageSize={20}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showReport && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowReport(false)}>
                    <div className="bg-white w-[90%] h-[90%] p-8 rounded shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between mb-2">
                            <h2 className="text-xl font-bold text-black ml-1">{`Detailed Report for ${selectedYear}`}</h2>

                            <button onClick={() => setShowReport(false)} className="p-2 rounded bg-red-500 hover:bg-red-700 text-white font-bold mb-4">
                                Close View
                            </button>
                        </div>

                        {/* Detailed Report sheet */}
                        <div className="ag-theme-alpine w-full h-[90%]">
                            <AgGridReact
                                rowData={detailedReport}
                                onGridReady={(params) => { params.api.sizeColumnsToFit(); }}
                                columnDefs={[
                                    { field: "SectionID", sort: "asc", filter: true },
                                    { field: "ReasonName" },
                                    { field: "Rte" },
                                    { field: "Dir" },
                                    { field: "MPFrom" },
                                    { field: "MPTo" },
                                    { field: "ReviewAction" },
                                    { field: "ReviewerNotes" },
                                    { field: "RemainingYears" },
                                    { field: "DesignerSDI" },
                                    { field: "PMSSDI" },
                                    { field: "MaintenanceRecommended" },
                                    { field: "DataYear" },
                                    { field: "AssignedReviewer" },
                                    { field: "SetNum" },
                                    { field: "ReviewCompletedDate" },
                                ]}
                                pagination={true}
                                paginationPageSize={20}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-5 gap-2 items-start">
                {/* Left Side */}
                <div className="col-span-3 flex flex-col">
                    <div className="w-full p-4 border bg-gray-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-3">
                                {/* First Row */}
                                <div className="flex items-center gap-4 text-black">
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                        <label className="text-m font-bold">
                                            Data Year
                                        </label>

                                        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-24 border p-2 rounded bg-white">
                                            <option value={2025}>2025</option>
                                            <option value={2024}>2024</option>
                                            <option value={2023}>2023</option>
                                            <option value={2022}>2022</option>
                                            <option value={2021}>2021</option>
                                        </select>
                                    </div>

                                    <span className="w-30 font-medium shrink-0">Miles Reviewed:</span>
                                    <input className="w-24 border px-2 bg-white" value={milesReviewed?.Reviewed ?? "N/A"} readOnly />

                                    <span className="ml-6">North:</span>
                                    <input className="w-20 border px-2 bg-white" value={milesReviewed?.CNorth ?? "N/A"} readOnly />

                                    <span>Central:</span>
                                    <input className="w-20 border px-2 bg-white" value={milesReviewed?.CCentral ?? "N/A"} readOnly />

                                    <span>South:</span>
                                    <input className="w-20 border px-2 bg-white" value={milesReviewed?.CSouth ?? "N/A"} readOnly />
                                </div>

                                {/* Second Row */}
                                <div className="flex items-center gap-4 text-black">
                                    <span className="ml-48.5 w-40 font-medium  whitespace-nowrap">To be Reviewed:</span>
                                    <input className="w-24 border px-2 bg-white" value={milesReviewed?.Outstanding ?? "N/A"} readOnly />

                                    <span className="ml-6">North:</span>
                                    <input className="w-20 border px-2 bg-white" value={milesReviewed?.PNorth ?? "N/A"} readOnly />

                                    <span>Central:</span>
                                    <input className="w-20 border px-2 bg-white" value={milesReviewed?.PCentral ?? "N/A"} readOnly />

                                    <span>South:</span>
                                    <input className="w-20 border px-2 bg-white" value={milesReviewed?.PSouth ?? "N/A"} readOnly />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col gap-3 justify-center w-85 ml-10">
                                <button type="button" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 h-8 flex items-center justify-center" onClick={handleUserBreakdown}>
                                    View Review Status breakdown by user
                                </button>

                                <button type="button" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 h-8 flex items-center justify-center" onClick={handleDetailedReport}>
                                    Open Detailed Report
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Assigned Reviews Chart */}
                    <div className="bg-white p-4 w-full">
                        <h2 className="text-xl text-black font-semibold text-center mb-4">
                            {`Total Reviews Identified in ${selectedYear}`}
                        </h2>

                        <ResponsiveContainer width="100%" height={745}>
                            <BarChart data={filteredAssignments} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <Legend layout="vertical" align="right" verticalAlign="top" />
                                <XAxis
                                    dataKey="category"
                                    interval={0}
                                    tick={({ x, y, payload, index }) => {
                                        const isEven = index % 2 === 0;

                                        return (
                                            <text
                                                x={x}
                                                y={y + (isEven ? 28 : 12)}
                                                textAnchor="middle"
                                                fontSize={14}
                                            >
                                                {payload.value}
                                            </text>
                                        );
                                    }}
                                />
                                {/*<XAxis dataKey="category" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 14 }} height={100} label={{ value: "Review Reasons", position: "insideBottom", offset: -20 }} />*/}
                                <YAxis tick={{ fontSize: 14 }} label={{ value: "Miles", angle: -90, position: "insideLeft" }} />
                                <Tooltip labelStyle={{ color: "Black" }} />
                                <Bar dataKey="Completed" stackId="totalReviews" fill="#5B9BD5">
                                    <LabelList dataKey="Completed" position="center" fill="#ffffff" />
                                </Bar>
                                <Bar dataKey="Pending" stackId="totalReviews" fill="#ED7D31">
                                    <LabelList dataKey="Pending" position="center" fill="#ffffff" />
                                </Bar>
                                <Bar dataKey="Pending_Incomplete" stackId="totalReviews" fill="#c2c2c2">
                                    <LabelList dataKey="Pending_Incomplete" position="center" fill="#000000" />
                                </Bar>
                                <RechartsDevtools />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Side */}
                <div className="col-span-2 flex flex-col gap-2">
                    {/* Distress Check */}
                    <div className="bg-white p-2">
                        <h2 className="text-xl text-black font-semibold text-center mb-4">
                            {`Distress Check Reviews in ${selectedYear}`}
                        </h2>

                        <ResponsiveContainer width="100%" height={401}>
                            <BarChart data={distressData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} >
                                <Legend layout="vertical" align="right" verticalAlign="top" />
                                <XAxis
                                    dataKey="name"
                                    interval={0}
                                    tick={({ x, y, payload, index }) => {
                                        const isEven = index % 2 === 0;

                                        return (
                                            <text
                                                x={x}
                                                y={y + (isEven ? 28 : 12)}
                                                textAnchor="middle"
                                                fontSize={14}
                                            >
                                                {payload.value}
                                            </text>
                                        );
                                    }}
                                />
                                <YAxis />
                                <Tooltip labelStyle={{ color: "Black" }} />
                                <Bar dataKey="TooLow" fill="#4592da">
                                    <LabelList dataKey="Accept" position="center" fill="#ffffff" />
                                </Bar>
                                <Bar dataKey="SlightlyLow" fill="#dd5823">
                                    <LabelList dataKey="Accept" position="center" fill="#ffffff" />
                                </Bar>
                                <Bar dataKey="Acceptable" fill="#91be47">
                                    <LabelList dataKey="Accept" position="center" fill="#ffffff" />
                                </Bar>
                                <Bar dataKey="SlightlyHigh" fill="#eedb2e">
                                    <LabelList dataKey="Accept" position="center" fill="#ffffff" />
                                </Bar>
                                <Bar dataKey="TooHigh" fill="#205bff">
                                    <LabelList dataKey="Accept" position="center" fill="#ffffff" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Review Results */}
                    <div className="bg-white p-2">
                        <h2 className="text-xl text-black font-semibold text-center mb-4">
                            {`Total Review Results in ${selectedYear}`}
                        </h2>

                        <ResponsiveContainer width="100%" height={401}>
                            <BarChart data={filteredReviewActions} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} >
                                <Legend layout="vertical" align="right" verticalAlign="top" />
                                <XAxis
                                    dataKey="category"
                                    interval={0}
                                    tick={({ x, y, payload, index }) => {
                                        const isEven = index % 2 === 0;

                                        return (
                                            <text
                                                x={x}
                                                y={y + (isEven ? 28 : 12)}
                                                textAnchor="middle"
                                                fontSize={14}
                                            >
                                                {payload.value}
                                            </text>
                                        );
                                    }}
                                />
                                <YAxis tick={{ fontSize: 14 }} label={{ value: "Miles", angle: -90, position: "insideLeft" }} />
                                <Tooltip labelStyle={{ color: "Black" }} />
                                <Bar dataKey="Accept" stackId="Action" fill="#5B9BD5">
                                    <LabelList dataKey="Accept" position="center" fill="#ffffff" />
                                </Bar>
                                <Bar dataKey="Reject" stackId="Action" fill="#e44040">
                                    <LabelList dataKey="Accept" position="center" fill="#ffffff" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </>
    );
}

function AssignmentForm() {
    const {
        data: assignmentData,
        refetch,
        isLoading,
        isError
    } = useQuery({
        queryKey: ['assignmentData'],
        queryFn: getAssignmentData
    });

    const reviewers = assignmentData?.reviewers || [];
    const [selectedReviewers, setSelectedReviewers] = useState([]);

    const [reviewTotalsArray, setReviewTotalsArray] = useState([]);

    // Months ahead to add to current date, based on which reason
    const dueDateAdds = {
        noDistress: 1,
        highIRI: 3,
        sdiChange: 1,
        paveType: 3,
        lowSDI: 2,
        resurfList: 2,
        highRut: 3,
        presList: 2,
        transCracking: 1,
        IRIChange: 1
    };

    const addMonths = (months) => {
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        return d.toISOString().split("T")[0];
    };

    // List of Review Reasons, total miles, and the set due date / whether to assign
    useEffect(() => {
        const totals = assignmentData?.totals;

        if (!totals) return;

        const formatted = Object.entries(totals).map(([key, value]) => ({
            label: key,
            value,
            dueDate:
                value !== 0
                    ? addMonths(dueDateAdds[key])
                    : "",
            assigned: value !== 0 ? true : false
        }));

        setReviewTotalsArray(formatted);
    }, [assignmentData?.totals]);

    const updateRow = (label, field, newValue) => {
        setReviewTotalsArray(prev =>
            prev.map(row =>
                row.label === label
                    ? { ...row, [field]: newValue }
                    : row
            )
        );
    };

    // Select All / Deselect All for reviewer list
    const allSelected =
        reviewers.length > 0 &&
        selectedReviewers.length === reviewers.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedReviewers([]); // deselect all
        } else {
            setSelectedReviewers(reviewers.map(r => r.UserName)); // select all
        }
    };

    // Assign to Reviewers handler
    const assignReviewers = async () => {
        const sectionsToAssign = reviewTotalsArray.filter(
            row => row.assigned && row.value > 0
        );

        if (selectedReviewers.length === 0) {
            alert("You must select reviewers");
            return;
        }

        if (sectionsToAssign.length === 0) {
            alert("There are no review sections selected");
            return;
        }

        try {
            await assignMiles(selectedReviewers, sectionsToAssign);

            const result = await refetch({
                cancelRefetch: false
            });

            setSelectedReviewers([]);

            alert("Miles were successfully assigned.");

        } catch (error) {
            console.error("Assignment failed:", error);
        }
    }

    const removeMilesFromReviewers = async () => {
        const sectionsToAssign = reviewTotalsArray.filter(
            row => row.assigned && row.value > 0
        );

        if (selectedReviewers.length === 0) {
            alert("You must select reviewers");
            return;
        }

        try {
            await removeMileage(selectedReviewers);

            const result = await refetch({
                cancelRefetch: false
            });

            setSelectedReviewers([]);

            alert("Miles were successfully removed.");

        } catch (error) {
            console.error("Assignment failed:", error);
        }
    }

    return (
        <div className="w-1/5 ml-180 mt-10">
            <div className="grid grid-cols-[minmax(250px,3fr)_120px_160px_80px] font-semibold text-black">
                <div className="p-2 text-right">Review Reason</div>
                <div className="p-2 text-center">Miles</div>
                <div className="p-2 text-center">Due Date</div>
                <div className="p-2 text-center">Assign</div>
            </div>

            {reviewTotalsArray.map((item) => {
                let label = ""

                switch (item.label) {
                    case "sdiChange":
                        label = "Significant SDI Change:"
                        break;
                    case "resurfList":
                        label = "Resurfacing List:"
                        break;
                    case "presList":
                        label = "Preservation List:"
                        break;
                    case "lowSDI":
                        label = "Very Low SDI:"
                        break;
                    case "highRut":
                        label = "High Rutting:"
                        break;
                    case "noDistress":
                        label = "Missing Distresses:"
                        break;
                    case "highIRI":
                        label = "High IRI:"
                        break;
                    case "paveType":
                        label = "Pave Type:"
                        break;
                    case "transCracking":
                        label = "High Transverse Cracking:"
                        break;
                    case "IRIChange":
                        label = "Significant IRI Change:"
                        break;
                }

                return (
                    <div key={item.label} className="grid grid-cols-[minmax(250px,3fr)_120px_160px_80px] font-semibold text-black">
                        <div className="p-2 text-right whitespace-nowrap">{label}</div>
                        <div className={`h-8 border border-gray-300 p-2 rounded bg-white text-black flex items-center justify-center ${item.value === 0 ? "opacity-50" : ""}`}>
                            {item.value.toFixed(2)}
                        </div>
                        <input
                            type="date"
                            value={item.dueDate || ""}
                            onChange={(e) => updateRow(item.label, "dueDate", e.target.value)}
                            className={`h-8 border border-gray-300 px-2 rounded bg-white text-black ${item.value === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={item.value === 0 ? true : false}
                        />
                        <div className="h-8 flex items-center justify-center">
                            <input
                                type="checkbox"
                                checked={item.assigned || false}
                                onChange={(e) =>
                                    updateRow(item.label, "assigned", e.target.checked)
                                }
                                className={`h-4 w-4 accent-blue-600 ${item.value === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                                disabled={item.value === 0 ? true : false}
                            />
                        </div>
                    </div>
                );
            })}

            <div className="grid grid-cols-[320px_1fr] gap-6 mt-8 items-start ml-10">
                <div className="border rounded bg-white p-2 text-black">
                    <div className="text-sm font-semibold mb-2">
                        Select Available Users to Assign
                    </div>

                    {/* Header */}
                    <div className="grid grid-cols-[1fr_80px_30px] text-sm font-semibold border-b pb-1 mb-1">
                        <span>Reviewers</span>
                        <span>Assigned Miles</span>
                    </div>

                    <div className="max-h-40 overflow-auto">
                        {reviewers.map((r) => (
                            <label key={r.UserName} className="grid grid-cols-[1fr_80px_30px] items-center py-1">
                                <span className="truncate">{r.UserName}</span>

                                <span className="text-gray-500 text-left">
                                    {r.miles.toFixed(2)}
                                </span>

                                <input
                                    type="checkbox"
                                    checked={selectedReviewers.some(
                                        (x) => x.UserName === r.UserName
                                    )}
                                    onChange={(e) => {
                                        setSelectedReviewers((prev) =>
                                            e.target.checked
                                                ? [
                                                    ...prev,
                                                    {
                                                        UserID: r.UserID,
                                                        UserName: r.UserName,
                                                        AssignedMiles: r.miles
                                                    }
                                                ]
                                                : prev.filter(
                                                    (x) => x.UserName !== r.UserName
                                                )
                                        );
                                    }}
                                />
                            </label>
                        ))}
                    </div>
                    <button onClick={toggleSelectAll} className="mt-2 w-full text-sm border rounded py-1 hover:bg-gray-100">
                        {allSelected ? "Deselect All" : "Select All"}
                    </button>
                </div>
                <div className="flex flex-col gap-2 w-50">
                    <div className="border rounded bg-white p-3 text-black">
                        <div className="text-sm font-semibold mb-2">
                            Assign Mileage Options
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="radio"
                                name="assignMode"
                                value="assign"
                                defaultChecked
                            />
                            Split Evenly
                        </label>

                        <label className="flex items-center gap-2 text-sm mt-1">
                            <input
                                type="radio"
                                name="assignMode"
                                value="remove"
                            />
                            Balance Total Assigned
                        </label>
                    </div>

                    <button className="border rounded px-3 py-2 bg-blue-500 hover:bg-blue-800" onClick={assignReviewers}>
                        Assign to Reviewer(s)
                    </button>

                    <button className="border rounded px-3 py-2 bg-blue-500 hover:bg-blue-800" onClick={removeMilesFromReviewers}>
                        Remove Assigned Mileage
                    </button>
                </div>
            </div>
        </div>
    );
}

function ReviewForm() {
    // All Reviews
    const [sectionType, setSectionType] = useState("new");
    const [reviews, setReviews] = useState([]);

    // Selected Review Data
    const [selectedReview, setSelectedReview] = useState([]);
    const [currentReason, setCurrentReason] = useState([]);
    const [tenthMileData, setTenthMileData] = useState([]);
    const [reviewStartTime, setReviewStartTime] = useState(null);

    // Review Inputs
    const [formDisabled, setFormDisabled] = useState(false);

    const [reviewAction, setReviewAction] = useState("");
    const [reviewComments, setReviewComments] = useState([]);
    const [selectedReviewComments, setSelectedReviewComments] = useState([]);
    const [reviewerComments, setReviewerComments] = useState("");
    const [designerSDI, setDesignerSDI] = useState("");
    const [maintenanceRecommended, setMaintenanceRecommended] = useState(false);
    const [selectedMileposts, setSelectedMileposts] = useState([]);

    // Distress Inputs
    const [pattern, setPattern] = useState("");
    const [transverse, setTransverse] = useState("");
    const [longitudinal, setLongitudinal] = useState("");
    const [wheelpathPattern, setWheelpathPattern] = useState("");
    const [wheelpathLongitudinal, setWheelpathLongitudinal] = useState("");
    const [RCCracking, setRCCracking] = useState("");

    const loadReviews = async () => {
        const reviewStatus = sectionType === "new" ? "Pending" : "Completed";

        const data = await getAssignedReviews(reviewStatus);
        setReviews(data);

        setSelectedReview([]);
        setCurrentReason([]);
        setTenthMileData([]);

        setReviewAction("");
        setReviewComments([]);
        setSelectedReviewComments([]);
        setReviewerComments("");
        setDesignerSDI("");
        setMaintenanceRecommended(false);

        setPattern("");
        setTransverse("");
        setLongitudinal("");
        setWheelpathPattern("");
        setWheelpathLongitudinal("");
        setRCCracking("");
        setFormDisabled(true);
        setReviewStartTime(null);
    };

    useEffect(() => {
        loadReviews();
    }, [sectionType]);

    const handleSelectReview = async (e) => {
        // Get selected review parameters
        const sectionID = Number(e.target.value);
        const review = reviews.find((item) => item.SectionID === sectionID);
        setSelectedReview(review);

        console.log(sectionID)

        // Reset Review Inputs
        setReviewAction("");
        setReviewComments([]);
        setSelectedReviewComments([]);
        setReviewerComments("");
        setDesignerSDI("");
        setMaintenanceRecommended(false);

        setPattern("");
        setTransverse("");
        setLongitudinal("");
        setWheelpathPattern("");
        setWheelpathLongitudinal("");
        setRCCracking("");

        setFormDisabled(true);
        setReviewStartTime(null);

        if (!review) {
            setCurrentReason([]);
            setTenthMileData([]);
            return;
        }

        // Get selected review's reason record
        const reason = await getReason(review["ReasonCode"]);
        setCurrentReason(reason);

        // Get tenth mile sections based on selected reason's query
        const tenthData = await getReasonQuery(reason["subFormSource"], review["Rte"], review["Dir"], review["MPStart"], review["MPEnd"], review["SectionID"], sectionType === "completed");
        setTenthMileData(tenthData);

        setFormDisabled(false);
        setReviewStartTime(new Date());
    };

    const handleReviewAction = async (e) => {
        const action = e.target.value
        setReviewAction(action);

        if (action === "") {
            return;
        }

        const reviewComments = await getReviewComments(action, currentReason["ReasonCode"]);
        setReviewComments(reviewComments);
    };

    const actionDesc = {
        "Accept": "PMS Data and reason for review are accurate/acceptable",
        "Reject": "PMS data and/or reason for review are inaccurate/unacceptable.",
        "Elevate": "Section being reviewed needs attention of supervisor."
    };

    const handleDistressReview = async (updatedValues = {}) => {
        const arr = [
            updatedValues.pattern ?? pattern,
            updatedValues.transverse ?? transverse,
            updatedValues.longitudinal ?? longitudinal,
            updatedValues.wheelpathPattern ?? wheelpathPattern,
            updatedValues.wheelpathLongitudinal ?? wheelpathLongitudinal,
            updatedValues.RCCracking ?? RCCracking
        ]

        let slightCount = 0;
        let acceptable = true;

        for (const item of arr) {
            if (item.startsWith("s")) {
                slightCount++;

                if (slightCount > 1) {
                    acceptable = false;
                    break;
                }
            }
            else if (item.startsWith("t")) {
                acceptable = false;
                break;
            }
            else if (item !== "acceptable") {
                acceptable = false;
            }
        }

        if (acceptable) {
            setReviewAction("Accept");

            const reviewComments = await getReviewComments("Accept", currentReason["ReasonCode"]);
            setReviewComments(reviewComments);
        } else {
            setReviewAction("Reject");

            const reviewComments = await getReviewComments("Reject", currentReason["ReasonCode"]);
            setReviewComments(reviewComments);
        }
    };

    const handleCompleteReview = async (e) => {
        const assignSelected = async (e) => {
            if (selectedMileposts.length === 0) return;

            let ReasonCode = selectedReview.ReasonCode;

            if (selectedReview.DistressCheck && unit === "PM") {
                ReasonCode = await queryReasonCodePM(currentReason.ReasonName);
            }

            const MPStart = Math.min(...selectedMileposts.map(item => item.MPFrom));
            const MPEnd = Math.max(...selectedMileposts.map(item => item.MPTo));

            const firstItem = selectedMileposts[0];

            const params = {
                Rte: firstItem.Rte,
                Dir: firstItem.Dir,
                MPStart: Number(MPStart.toFixed(1)),
                MPEnd: Number(MPEnd.toFixed(1)),
                Miles: Number((MPEnd - MPStart).toFixed(1)),
                Region: selectedReview.Region,
                SetNum: selectedReview.SetNum,
                AssignedReviewer: "HelinaB",
                ReasonCode: ReasonCode,
                ReviewStatus: "Pending",
                ElevatedComments: reviewerComments,
                DataYear: selectedReview.DataYear,
                ElevatedByUser: "HelinaB",
                DateAssigned: new Date().toISOString()
            };

            await insertElevatedSection(params);
        };

        const resetReviewForm = async (keepSection) => {
            // Reset Review Inputs
            setReviewAction("");
            setReviewComments([]);
            setSelectedReviewComments([]);
            setReviewerComments("");
            setDesignerSDI("");
            setMaintenanceRecommended(false);

            setPattern("");
            setTransverse("");
            setLongitudinal("");
            setWheelpathPattern("");
            setWheelpathLongitudinal("");
            setRCCracking("");

            if (!keepSection) {
                setSelectedReview([]);
                setCurrentReason([]);
                setTenthMileData([]);
                setFormDisabled(true);
                setReviewStartTime(null);
                return;
            }

            // Get selected review's reason record
            const reason = await getReason(selectedReview.ReasonCode);
            setCurrentReason(reason);

            // Get tenth mile sections based on selected reason's query
            const tenthData = await getReasonQuery(reason["subFormSource"], selectedReview.Rte, selectedReview.Dir, selectedReview.MPStart, selectedReview.MPEnd, selectedReview.SectionID, sectionType === "completed");
            setTenthMileData(tenthData);

            setFormDisabled(false);
            setReviewStartTime(new Date());
        };

        // currently default, when login is added, will change
        const unit = "PD"
        let finishedReview = true

        // Validation
        if (reviewAction === "") {
            alert("You must select a recommended action.");
            return;
        } else if (reviewerComments === "" && selectedReviewComments.length === 0) {
            alert("You must select comments from the list box AND/OR include review notes on this section before it can be completed.");
            return;
        } else if (selectedMileposts.length === 0) {
            alert("You must select mileposts this review applies to in the list box on the left.");
            return;
        }

        finishedReview = selectedMileposts.length === tenthMileData.length

        if (currentReason?.DistressCheck && unit === "PM" && reviewAction !== "Elevate") {
            if (pattern === "" || transverse === "" || longitudinal === "" || wheelpathPattern === "" || wheelpathLongitudinal === "" || RCCracking === "") {
                alert("All distress types need a review rating.");
                return;
            }
        } else if (unit === "PD" && designerSDI === "") {
            alert("You must enter a suggested SDI for these mileposts.");
            return;
        }

        // Elevate
        if (reviewAction === "Elevate") {
            if (selectedReview?.ElevatedByUser === "") {
                alert("Section can not be elevated further. Please discuss this section in person to resolve any issues then resubmit as Accepted/Rejected.");
                return;
            } else {
                await assignSelected();
            }
        } else if (currentReason?.DistressCheck && unit === "PD" && reviewAction === "Reject") {
            await assignSelected();
        }

        // Update
        if (sectionType === "completed") {
            for (const item of selectedMileposts) {
                const params = {
                    ReviewAction: reviewAction,
                    ReviewerNotes: [...selectedReviewComments, reviewerComments].filter(Boolean).join("//"),
                    ReviewCompletedDate: new Date().toISOString()
                }

                const matching = {
                    SectionID: selectedReview.SectionID,
                    Rte: item.Rte,
                    Dir: item.Dir,
                    MPFrom: item.MPFrom,
                    MPTo: item.MPTo,
                }

                const tenthMileID = await updateTenthMileReview(params, matching);

                if (currentReason.DistressCheck && unit === "PM") {
                    const distressParams = {
                        TenthMileID: tenthMileID,
                        Pattern: reviewAction === "Elevate" ? "UNKNOWN" : pattern,
                        Transverse: reviewAction === "Elevate" ? "UNKNOWN" : transverse,
                        Longitudinal: reviewAction === "Elevate" ? "UNKNOWN" : longitudinal,
                        WheelPath_Pattern: reviewAction === "Elevate" ? "UNKNOWN" : wheelpathPattern,
                        WheelPath_Longitudinal: reviewAction === "Elevate" ? "UNKNOWN" : wheelpathLongitudinal,
                        RC_Cracking: reviewAction === "Elevate" ? "UNKNOWN" : RCCracking
                    };

                    await insertDistressCheck(distressParams);
                }
            }

            alert("Review successfully updated");
            return;
        }

        for (const item of selectedMileposts) {
            const SDI = await getSDI(item.Rte, item.Dir, item.MPFrom);

            const params = {
                SectionID: selectedReview.SectionID,
                Rte: item.Rte,
                Dir: item.Dir,
                MPFrom: item.MPFrom,
                MPTo: item.MPTo,
                ReviewAction: (currentReason.DistressCheck && unit === "PD" && reviewAction === "Reject") ? "Elevate_M" : reviewAction,
                DesignerSDI: (currentReason.DistressCheck && unit === "PD") ? designerSDI : null,
                MaintenanceRecommended: maintenanceRecommended,
                PMSSDI: SDI,
                ReviewerNotes: [...selectedReviewComments, reviewerComments].filter(Boolean).join("//"),
                ReviewCompletedDate: new Date().toISOString()
            }

            const tenthMileID = await insertTenthMileReview(params);

            if (currentReason.DistressCheck && unit === "PM") {
                const distressParams = {
                    TenthMileID: tenthMileID,
                    Pattern: reviewAction === "Elevate" ? "UNKNOWN" : pattern,
                    Transverse: reviewAction === "Elevate" ? "UNKNOWN" : transverse,
                    Longitudinal: reviewAction === "Elevate" ? "UNKNOWN" : longitudinal,
                    WheelPath_Pattern: reviewAction === "Elevate" ? "UNKNOWN" : wheelpathPattern,
                    WheelPath_Longitudinal: reviewAction === "Elevate" ? "UNKNOWN" : wheelpathLongitudinal,
                    RC_Cracking: reviewAction === "Elevate" ? "UNKNOWN" : RCCracking
                };

                await insertDistressCheck(distressParams);
            }
        }

        if (finishedReview) {
            await updateQASection(selectedReview.SectionID, reviewStartTime);
            alert("Review Section Completed");

            await queryUserTracking("HelinaB", selectedReview.SectionID, "Helina Bitewlign"); // Hard coded for now while no login.
            resetReviewForm(false);
            loadReviews();
        } else {
            resetReviewForm(true);
        }
    }


    // Dynamic field list for AGGrid based on queried tenth mile data
    const tenthMileColumns = tenthMileData?.length
        ? Object.keys(tenthMileData[0]).map((field) => ({
            field,
            headerName: field,
        }))
        : [];

    return (
        <div className="mt-4 max-w-[1700px] mx-auto flex flex-col gap-5 text-black">
            {/* Top */}
            <div className="flex items-center gap-3 ml-0">
                <label className="font-bold text-black">
                    {"Sections in your queue:"}
                </label>

                <select value={selectedReview?.SectionID ?? ""} onChange={handleSelectReview} className="w-80 h-9 border rounded px-2 bg-white text-black">
                    <option value="">-- Select --</option>
                    {reviews.map(item => (
                        <option key={item.SectionID} value={item.SectionID}>
                            {item.Rte} | {item.Dir} | {item.MPStart} - {item.MPEnd} | {item.DueDate}
                        </option>
                    ))}
                </select>
            </div>

            {/* Bottom */}
            <div className="grid grid-cols-[180px_180px_320px_220px] gap-5 items-start">

                {/* Review Sections */}
                <div className="border rounded bg-white p-3">
                    <div className="font-semibold mb-2 text-sm">
                        Review Sections
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="radio"
                            name="sectionType"
                            value="new"
                            checked={sectionType === "new"}
                            onChange={(e) => setSectionType(e.target.value)}
                        />
                        New
                    </label>

                    <label className="flex items-center gap-2 text-sm mt-2">
                        <input
                            type="radio"
                            name="sectionType"
                            value="completed"
                            checked={sectionType === "completed"}
                            onChange={(e) => setSectionType(e.target.value)}
                        />
                        Previously Completed
                    </label>
                </div>

                {/* Info */}
                <div className="space-y-3">
                    <div>
                        <label className="block font-semibold text-sm mb-1">
                            Reason for Review
                        </label>
                        <input
                            className="w-full h-8 border rounded px-2 bg-white"
                            value={currentReason?.ReasonName ?? ""}
                            readOnly
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-sm mb-1">
                            Data Year
                        </label>
                        <input
                            className="w-full h-8 border rounded px-2 bg-white"
                            value={selectedReview?.DataYear ?? ""}
                            readOnly
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-sm mb-1">
                            Set Number
                        </label>
                        <input
                            className="w-full h-8 border rounded px-2 bg-white"
                            value={selectedReview?.SetNum ?? ""}
                            readOnly
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="w-80">
                    <label className="block font-semibold text-sm mb-1">
                        Review Reason Description
                    </label>

                    <textarea
                        className="w-full h-42 border rounded p-2 resize-none bg-white"
                        value={currentReason?.ReasonDescription ?? ""}
                        readOnly
                    />
                </div>

                {/* Elevation */}
                {selectedReview?.ElevatedByUser && <div className="space-y-3">
                    <div>
                        <label className="block font-semibold text-sm mb-1">
                            Section Elevated by:
                        </label>

                        <input
                            className="w-full h-8 border rounded px-2 bg-white"
                            value={selectedReview?.ElevatedByUser ?? ""}
                            readOnly
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-sm mb-1">
                            Elevated Comments:
                        </label>

                        <textarea
                            className="w-full h-25 border rounded p-2 resize-none bg-white"
                            value={selectedReview?.ElevatedComments ?? ""}
                            readOnly
                        />
                    </div>
                </div>}
            </div>

            <div className="ag-theme-alpine w-full h-[250px] mb-8">
                <label className="block font-semibold text-sm mb-1">
                    Tenth Mile Sections
                </label>

                <AgGridReact
                    rowData={tenthMileData}
                    columnDefs={tenthMileColumns}
                    onGridReady={(params) => {
                        params.api.autoSizeAllColumns();
                    }}
                    defaultColDef={{
                        flex: 1,
                        resizable: true,
                        sortable: true,
                        filter: true,
                    }}
                    pagination={true}
                    paginationPageSize={20}
                />
            </div>

            <fieldset className="border-2 rounded-lg p-4 mb-6">
                <legend className="px-2 font-bold text-black">
                    Review Inputs
                </legend>

                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <label className="font-bold text-black">
                                Review Action:
                            </label>

                            <select value={reviewAction} onChange={handleReviewAction} className={`w-28 h-9 border rounded px-2 bg-white text-black ${formDisabled ? "opacity-50 cursor-not-allowed" : ""}`} disabled={formDisabled}>
                                <option value="">-- Select --</option>
                                <option value="Accept">Accept</option>
                                <option value="Reject">Reject</option>
                                <option value="Elevate">Elevate</option>
                            </select>
                        </div>

                        {/* TODO: Replace true with condition for unit once login exists. If unit is "PD", visible, otherwise not. */}
                        {true &&
                            <div className="flex items-center gap-3 ml-0">
                                <label className="font-bold text-black">
                                    Designer Suggested SDI:
                                </label>

                                <input value={designerSDI} onChange={(e) => setDesignerSDI(e.target.value)} className={`w-28 h-9 border rounded px-2 bg-white text-black ${formDisabled ? "opacity-50 cursor-not-allowed" : ""}`} disabled={formDisabled} />
                            </div>
                        }

                        <div className="flex items-center gap-3 ml-0">
                            <label className="font-bold text-black">
                                Recommend Immediate Maintenance:
                            </label>

                            <input
                                onChange={(e) => setMaintenanceRecommended(e.target.checked)}
                                type="checkbox"
                                checked={maintenanceRecommended}
                                disabled={formDisabled}
                            />
                        </div>

                        <div className="border rounded bg-white p-2 text-black w-110">
                            <div className="text-sm font-semibold mb-2">
                                Select Mileposts this review applies to
                            </div>

                            {/* Header */}
                            <div className="grid grid-cols-[60px_100px_80px_80px_70px] text-sm font-semibold border-b pb-1 mb-1">
                                <span>Rte</span>
                                <span>Direction</span>
                                <span>MPFrom</span>
                                <span>MPTo</span>
                                <span>Applies</span>
                            </div>

                            <div className="h-40 overflow-y-auto">
                                {tenthMileData?.map((r) => (
                                    <label key={`${r.Rte}-${r.Direction}-${r.MPFrom}-${r.MPTo}`} className="grid grid-cols-[60px_100px_80px_80px_70px] items-center py-1">
                                        <span className="truncate">{r.Rte}</span>
                                        <span className="text-black text-left">
                                            {r.Direction}
                                        </span>
                                        <span className="text-black text-left">
                                            {r.MPFrom}
                                        </span>
                                        <span className="text-black text-left">
                                            {r.MPTo}
                                        </span>

                                        <input
                                            checked={selectedMileposts.some(
                                                (x) =>
                                                    x.Rte === r.Rte &&
                                                    x.Dir === r.Dir &&
                                                    x.MPFrom === r.MPFrom &&
                                                    x.MPTo === r.MPTo
                                            )}
                                            onChange={() => {
                                                setSelectedMileposts((prev) => {
                                                    const exists = prev.some(
                                                        (x) =>
                                                            x.Rte === r.Rte &&
                                                            x.Dir === r.Dir &&
                                                            x.MPFrom === r.MPFrom &&
                                                            x.MPTo === r.MPTo
                                                    );

                                                    return exists
                                                        ? prev.filter(
                                                            (x) =>
                                                                !(
                                                                    x.Rte === r.Rte &&
                                                                    x.Dir === r.Dir &&
                                                                    x.MPFrom === r.MPFrom &&
                                                                    x.MPTo === r.MPTo
                                                                )
                                                        )
                                                        : [...prev, r];
                                                });
                                            }}
                                            type="checkbox"
                                        />
                                    </label>
                                ))}
                            </div>

                            <button
                                className={`mt-2 w-full text-sm border rounded py-1 hover:bg-gray-100 ${formDisabled ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                onClick={() => {
                                    if (selectedMileposts.length === tenthMileData.length) {
                                        setSelectedMileposts([]);
                                    } else {
                                        setSelectedMileposts(tenthMileData);
                                    }
                                }}
                                disabled={tenthMileData?.length === 0 || formDisabled}
                            >
                                {selectedMileposts.length === tenthMileData.length && tenthMileData.length !== 0
                                    ? "Deselect All"
                                    : "Select All"}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="font-bold text-black">
                                Action Description:
                            </label>

                            <input
                                className={`w-full h-8 border rounded px-2 bg-white ${formDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                value={actionDesc[reviewAction] || ""}
                                readOnly
                                disabled={formDisabled}
                            />
                        </div>

                        <div>
                            <label className="font-bold text-black">
                                Select any that apply to your review:
                            </label>

                            <select
                                multiple
                                value={selectedReviewComments}
                                onChange={(e) => {
                                    const selected = Array.from(
                                        e.target.selectedOptions,
                                        (option) => option.value
                                    );

                                    setSelectedReviewComments(selected);
                                }}
                                className={`w-full border p-2 rounded bg-white h-36 ${formDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                disabled={formDisabled}
                            >
                                {reviewComments?.map((item) => (
                                    <option key={item.ReviewComments} value={item.ReviewComments}>
                                        {item.ReviewComments}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="font-bold text-black">
                                Additional Comments:
                            </label>

                            <textarea
                                className={`w-full h-36 border rounded p-2 resize-none bg-white ${formDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                value={reviewerComments}
                                onChange={(e) => setReviewerComments(e.target.value)}
                                disabled={formDisabled}
                            />
                        </div>

                        <div className="flex justify-center mt-4">
                            <button
                                type="button"
                                onClick={handleCompleteReview}
                                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-gray-300 h-8 flex items-center justify-center"
                                disabled={formDisabled}
                            >
                                {sectionType === "completed" ? "Save Review" : "Complete Review"}
                            </button>
                        </div>
                    </div>

                    {/* TODO: Once Login is put in, replace true with unit check, if unit is "PD", not visible */}
                    {currentReason?.DistressCheck && true &&
                        <div className="space-y-3">
                            <fieldset className="border-2 rounded-lg p-4 mb-6">
                                <legend className="px-2 font-bold text-black">
                                    Distress Review
                                </legend>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <label className="font-bold text-black w-48 text-right">
                                                Pattern:
                                            </label>

                                            <select
                                                value={pattern}
                                                onChange={(e) => {
                                                    setPattern(e.target.value);
                                                    handleDistressReview({ pattern: e.target.value });
                                                }}
                                                className="w-28 h-9 border rounded px-2 bg-white text-black"
                                                disabled={formDisabled}
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="acceptable">Acceptable</option>
                                                <option value="tooHigh">Too High</option>
                                                <option value="slightlyHigh">Slightly High</option>
                                                <option value="tooLow">Too Low</option>
                                                <option value="slightlyLow">Slightly Low</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="font-bold text-black w-48 text-right">
                                                Transverse:
                                            </label>

                                            <select
                                                value={transverse}
                                                onChange={(e) => {
                                                    setTransverse(e.target.value);
                                                    handleDistressReview({ transverse: e.target.value });
                                                }}
                                                className="w-28 h-9 border rounded px-2 bg-white text-black"
                                                disabled={formDisabled}
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="acceptable">Acceptable</option>
                                                <option value="tooHigh">Too High</option>
                                                <option value="slightlyHigh">Slightly High</option>
                                                <option value="tooLow">Too Low</option>
                                                <option value="slightlyLow">Slightly Low</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="font-bold text-black w-48 text-right">
                                                Longitudinal:
                                            </label>

                                            <select
                                                value={longitudinal}
                                                onChange={(e) => {
                                                    setLongitudinal(e.target.value);
                                                    handleDistressReview({ longitudinal: e.target.value });
                                                }}
                                                className="w-28 h-9 border rounded px-2 bg-white text-black"
                                                disabled={formDisabled}
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="acceptable">Acceptable</option>
                                                <option value="tooHigh">Too High</option>
                                                <option value="slightlyHigh">Slightly High</option>
                                                <option value="tooLow">Too Low</option>
                                                <option value="slightlyLow">Slightly Low</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <label className="font-bold text-black w-48 text-right">
                                                WheelPath Pattern:
                                            </label>

                                            <select
                                                value={wheelpathPattern}
                                                onChange={(e) => {
                                                    setWheelpathPattern(e.target.value);
                                                    handleDistressReview({ wheelpathPattern: e.target.value });
                                                }}
                                                className="w-28 h-9 border rounded px-2 bg-white text-black"
                                                disabled={formDisabled}
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="acceptable">Acceptable</option>
                                                <option value="tooHigh">Too High</option>
                                                <option value="slightlyHigh">Slightly High</option>
                                                <option value="tooLow">Too Low</option>
                                                <option value="slightlyLow">Slightly Low</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="font-bold text-black w-48 text-right">
                                                WheelPath Longitudinal:
                                            </label>

                                            <select
                                                value={wheelpathLongitudinal}
                                                onChange={(e) => {
                                                    setWheelpathLongitudinal(e.target.value);
                                                    handleDistressReview({ wheelpathLongitudinal: e.target.value });
                                                }}
                                                className="w-28 h-9 border rounded px-2 bg-white text-black"
                                                disabled={formDisabled}
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="acceptable">Acceptable</option>
                                                <option value="tooHigh">Too High</option>
                                                <option value="slightlyHigh">Slightly High</option>
                                                <option value="tooLow">Too Low</option>
                                                <option value="slightlyLow">Slightly Low</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="font-bold text-black w-48 text-right">
                                                RC Cracking:
                                            </label>

                                            <select
                                                value={RCCracking}
                                                onChange={(e) => {
                                                    setRCCracking(e.target.value);
                                                    handleDistressReview({ RCCracking: e.target.value });
                                                }}
                                                className="w-28 h-9 border rounded px-2 bg-white text-black"
                                                disabled={formDisabled}
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="acceptable">Acceptable</option>
                                                <option value="tooHigh">Too High</option>
                                                <option value="slightlyHigh">Slightly High</option>
                                                <option value="tooLow">Too Low</option>
                                                <option value="slightlyLow">Slightly Low</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center mt-8 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const allSelected =
                                                pattern === "acceptable" &&
                                                transverse === "acceptable" &&
                                                longitudinal === "acceptable" &&
                                                wheelpathPattern === "acceptable" &&
                                                wheelpathLongitudinal === "acceptable" &&
                                                RCCracking === "acceptable";

                                            const newValue = allSelected ? "" : "acceptable";

                                            setPattern(newValue);
                                            setTransverse(newValue);
                                            setLongitudinal(newValue);
                                            setWheelpathPattern(newValue);
                                            setWheelpathLongitudinal(newValue);
                                            setRCCracking(newValue);

                                            handleDistressReview({
                                                pattern: newValue,
                                                transverse: newValue,
                                                longitudinal: newValue,
                                                wheelpathPattern: newValue,
                                                wheelpathLongitudinal: newValue,
                                                RCCracking: newValue
                                            });
                                        }}
                                        className="px-4 py-2 border rounded bg-white text-black hover:bg-gray-100"
                                        disabled={formDisabled}
                                    >
                                        Accept All
                                    </button>
                                </div>
                            </fieldset>
                        </div>
                    }
                </div>
            </fieldset>
        </div>
    );
}