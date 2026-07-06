import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query'

import { getReportsData } from "../utils/supabase/qareview-queries";

import { RechartsDevtools } from '@recharts/devtools'
import { BarChart, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer, Legend, LabelList } from 'recharts';

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
    const {
        data: reportsData,
        isLoading,
        isError
    } = useQuery({
        queryKey: ['reportsData'],
        queryFn: getReportsData
    });

    const filteredAssignments = Object.values(
        (reportsData?.assignedReviews ?? [])
            .filter((item) => Number(item?.DataYear) === 2025)
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

    const distressReviews = reportsData?.distressReviews || [];

    const distressData = [
        { name: "Pattern", "TooLow": 0, "SlightlyLow": 0, "Acceptable": 0, "SlightlyHigh": 0, "TooHigh": 0 },
        { name: "WheelPath_Pattern", "TooLow": 0, "SlightlyLow": 0, "Acceptable": 0, "SlightlyHigh": 0, "TooHigh": 0 },
        { name: "Logitudinal", "TooLow": 0, "SlightlyLow": 0, "Acceptable": 0, "SlightlyHigh": 0, "TooHigh": 0 },
        { name: "WheelPath_Longitudinal", "TooLow": 0, "SlightlyLow": 0, "Acceptable": 0, "SlightlyHigh": 0, "TooHigh": 0 },
        { name: "Transverse", "TooLow": 0, "SlightlyLow": 0, "Acceptable": 0, "SlightlyHigh": 0, "TooHigh": 0 },
    ];

    distressData.forEach(row => {
        const filteredData = distressReviews.filter(item => item.DataYear === 2025);

        row.TooLow = Math.round(filteredData.filter(r => r[row.name] === "Too Low").length / filteredData.length * 100) / 100;
        row.SlightlyLow = Math.round(filteredData.filter(r => r[row.name] === "Slightly Low").length / filteredData.length * 100) / 100;
        row.Acceptable = Math.round(filteredData.filter(r => r[row.name] === "Acceptable").length / filteredData.length * 100) / 100;
        row.SlightlyHigh = Math.round(filteredData.filter(r => r[row.name] === "Slightly High").length / filteredData.length * 100) / 100;
        row.TooHigh = Math.round(filteredData.filter(r => r[row.name] === "Too High").length / filteredData.length * 100) / 100;
    });

    return(
        <div className="grid grid-cols-5 gap-2 items-start">
            {/* Left Side */}
            <div className="col-span-3 flex flex-col">
                <div className="w-full p-4 border bg-gray-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-3">
                            {/* First Row */}
                            <div className="flex items-center gap-4 text-black">
                                <span className="w-40 font-medium">Miles Reviewed:</span>
                                <input className="w-24 border px-2 bg-white" value="432.51" readOnly />

                                <span className="ml-6">North:</span>
                                <input className="w-20 border px-2 bg-white" value="95.6" readOnly />

                                <span>Central:</span>
                                <input className="w-20 border px-2 bg-white" value="198.16" readOnly />

                                <span>South:</span>
                                <input className="w-20 border px-2 bg-white" value="138.75" readOnly />
                            </div>

                            {/* Second Row */}
                            <div className="flex items-center gap-4 text-black">
                                <span className="w-40 font-medium">Still to be Reviewed:</span>
                                <input className="w-24 border px-2 bg-white" value="132.15" readOnly />

                                <span className="ml-6">North:</span>
                                <input className="w-20 border px-2 bg-white" value="43.77" readOnly />

                                <span>Central:</span>
                                <input className="w-20 border px-2 bg-white" value="51.1" readOnly />

                                <span>South:</span>
                                <input className="w-20 border px-2 bg-white" value="37.28" readOnly />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col gap-3 justify-center">
                            <button className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 h-8 flex items-center justify-center">
                                View Review Status breakdown by user
                            </button>

                            <button className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 h-8 flex items-center justify-center">
                                Open Detailed Report
                            </button>
                        </div>
                    </div>
                </div>

                {/* Assigned Reviews Chart */}
                <div className="bg-white p-4 w-full">
                    <ResponsiveContainer width="100%" height={700}>
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
                    <ResponsiveContainer width="100%" height={401}>
                        <BarChart data={distressData} >
                            <Legend layout="vertical" align="right" verticalAlign="top" />
                            <Tooltip labelStyle={{ color: "Black" }} />
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
                            <Tooltip />
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
                    <ResponsiveContainer width="100%" height={401}>
                        <BarChart data={filteredReviewActions}>
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