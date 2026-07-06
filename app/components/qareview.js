import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query'

import { getReportsData, getUserMilesBreakdown, getDetailedReport } from "../utils/supabase/qareview-queries";

import { RechartsDevtools } from '@recharts/devtools'
import { BarChart, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer, Legend, LabelList } from 'recharts';

import { AgGridReact } from 'ag-grid-react';

export default function qareview() {
    const tabs = [
        { id: "reports", label: "Reports"},
        { id: "assignment", label: "QA Assignment"},
        { id: "review", label: "QA Review"}
    ];

    const [activeTab, setActiveTab] = useState(tabs[0].id);

    return(
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

    async function handleUserBreakdown () {
        const data = await getUserMilesBreakdown(selectedYear);

        setUserBreakdown(data);
        setShowBreakdown(true);
    }

    async function handleDetailedReport () {
        const data = await getDetailedReport(selectedYear);

        setDetailedReport(data);
        setShowReport(true);
    }

    return(
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
                            onGridReady={(params) => {params.api.sizeColumnsToFit();}}
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
    return(
        <div>Hey</div>
    );
}

function ReviewForm() {
    return(
        <div>Hey</div>
    );
}