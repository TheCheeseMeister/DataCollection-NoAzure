import { getLookups } from "../utils/supabase/queries";

import React, {useEffect, useState} from 'react';

export default function collection() {
    const tabs = [
        { id: "statusInput", label: "Set Status / Input"},
        { id: "collection", label: "Collection Status"},
        { id: "reruns", label: "Reruns"}
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
            {activeTab === "statusInput" && <StatusInputForm />}
            {activeTab === "collection" && <CollectionForm />}
            {activeTab === "reruns" && <RerunsForm />}
        </div>
      </div>
    );
}

function StatusInputForm() {
  const [formData, setFormData] = useState({
    recordType: "New Record",
    collectionYear: "",
    sets: "",

    SDIFileName: "",
    setsReceived: "",
    dateReceived: "",
    dataCollected: "",
    assignedTo: "",
    totalMiles: "",
    imageCheck: "",
    rawStart: "",
    rawEnd: "",
    offsetFixed: "",
    weather: "",
    airTemp: "",

    autocrackStart: "",
    autocrackEnd: "",
    autoclassStart: "",
    autoclassEnd: "",
    tenthMileReport: "",
    pathviewVersion: "",
    dateBackedUp: "",
    drivesFormatted: "",
    missingSets: "",
    retestRequired: false,
    retestSets: "",
    pavementTemp: "",
    truckNum: "Pathways 2",
    comments: "",
    collectionIssues: ""
  });

  const handleField = (event) => {
    const { name, value } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));

    console.log(`${name}: ${value}`)
  }

  return(
    <form className='text-black p-6 w-full max-w-6xl mx-auto'>
      <div className="flex justify-center gap-6 mb-8">
        <div className="w-36">
          <label className="block text-sm mb-1 font-bold">
              Record Type
          </label>
          <select name="recordType" value={formData.recordType} onChange={handleField} className="w-full border p-2 rounded bg-white">
              <option value="New Record">New Record</option>
              <option value="Existing Record">Existing Record</option>
          </select>
        </div>

        <div className="w-36">
          <label className="block text-sm mb-1 font-bold">
              Collection Year
          </label>
          <select className="w-full border p-2 rounded bg-white" onChange={(e) => {
          }}>
              <option>2025</option>
              <option>2024</option>
              <option>2023</option>
              <option>2022</option>
              <option>2021</option>
          </select>
        </div>

        <div className="w-64">
          <label className="block text-sm mb-1 font-bold">
              Sets
          </label>
          <select className="w-full border p-2 rounded bg-white" onChange={(e) => {
          }}>
              <option>Set 1</option>
              <option>Set 2</option>
          </select>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-6 w-fit">
          {/* Left Column */}
          <div className="space-y-2">
            <div>
              <label className="block text-sm mb-1 font-bold">
                  SDI File Name *
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Sets Received *
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Date Received *
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Data Collected *
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Assigned To
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Total Miles
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  First/Last Image Check
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Raw Files Processed Start Date
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Raw Files Processed End Date
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Beginning/Ending Offset Fixed
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Weather
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Air Temperature
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>
          </div>
            
          {/* Middle Column */}
          <div className="space-y-2">
            <div>
              <label className="block text-sm mb-1 font-bold">
                  Autocrack Run Start Date
              </label>
              <input type="date" className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Autocrack Run End Date
              </label>
              <input type="date" className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Autoclass Run Start Date
              </label>
              <input type="date" className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Autoclass Run End Date
              </label>
              <input type="date" className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  10th Mile Report Generated
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Pathview Version
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
                  <option value="1514">1514</option>
                  <option value="1409">1409</option>
                  <option value="1507">1507</option>
                  <option value="1498">1498</option>
                  <option value="1494">1494</option>
                  <option value="1492">1492</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Date Backed Up
              </label>
              <input type="date" className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Drives Formatted
              </label>
              <input type="date" className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Missing Sets
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>
            
            <div className="mb-3.5">
              <label className="block text-sm mb-1 font-bold">
                Retest Required
              </label>

              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600 mt-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Retest Sets
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Pavement Temperature
              </label>
              <select onChange={(e) => {
              }} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-2">
            <div className="w-64">
              <label className="block text-sm mb-1 font-bold">
                Truck Num
              </label>

              <div className="border border-gray-400 rounded p-3 flex gap-6 w-fit">
                <label className="flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="radio"
                    name="truckNum"
                    value="Pathways 1"
                    checked={formData.truckNum === "Pathways 1"}
                    onChange={handleField}
                  />
                  Pathways 1
                </label>

                <label className="flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="radio"
                    name="truckNum"
                    value="Pathways 2"
                    checked={formData.truckNum === "Pathways 2"}
                    onChange={handleField}
                  />
                  Pathways 2
                </label>

                <label className="flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="radio"
                    name="truckNum"
                    value="Other"
                    checked={formData.truckNum === "Other"}
                    onChange={handleField}
                  />
                  Other
                </label>
              </div>
            </div>

            <div className="w-128">
              <label className="block text-sm mb-1 font-bold">
                  Comments
              </label>
              <textarea className="w-full border p-2 rounded h-32 bg-white" />
            </div>

            <div className="w-128">
              <label className="block text-sm mb-1 font-bold">
                  Collection Issues
              </label>
              <textarea className="w-full border p-2 rounded h-32 bg-white" />
            </div>

            {/* Button */}
            <div className="mt-8 flex justify-center">
                <button type="button" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
                  Add New
                </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function CollectionForm() {
  return(
    <div>Collection</div>
  );
}

function RerunsForm() {
  return(
    <div>Reruns</div>
  );
}