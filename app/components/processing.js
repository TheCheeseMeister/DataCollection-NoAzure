import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query'

import * as XLSX from "xlsx";

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

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setFileName(file.name);
        setSelectedFile(file);
    };

    const handleImport = async (e) => {
        if (!selectedFile) {
            alert("Please select an Excel file first.");
            return;
        }

        // Store Excel file as JSON using XLSX Library
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log(jsonData);

        // TODO: Process Data
    };

    return (
        <div className="flex items-center gap-3 p-4">
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
    );
}

function RideQualityChecker() {
    return (
        <div>
            RQ Checker
        </div>
    );
}