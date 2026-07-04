import { getStatusInputTables, insertNewStatus, updateExistingStatus } from "../utils/supabase/collection-queries";

import React, {useMemo, useEffect, useState} from 'react';
import { useQuery } from '@tanstack/react-query'

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
  const initialFormData = {
    recordType: "New Record",
    collectionYear: "2025",
    sets: "",

    SDIFileName: "",
    setsReceived: "",
    dateReceived: "",
    dateCollected: "",
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
    collectionIssues: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleField = (event) => {
    const { name, value, type, checked } = event.target;
    
    if (name === "recordType") {
      setFormData({
        ...initialFormData,
        recordType: value
      });
      return;
    } else if (name === "sets") {
      const selectedRow = inputTables?.collectionLog?.find(
        (item) => item.SetNum === value
      );

      if (!selectedRow) {
        setFormData((prevData) => ({
          ...prevData,
          [name]: type === "checkbox" ? checked : value
        }));
        return;
      };

      setFormData((prev) => ({
        ...prev,
        sets: value,
        
        SDIFileName: selectedRow["SDIFileName"] ?? "",
        setsReceived: selectedRow["SetNum"] ?? "",
        dateReceived: selectedRow["DateReceived"] ?? "",
        dateCollected: selectedRow["DateCollected"] ?? "",
        assignedTo: selectedRow["AssignedTo"] ?? "",
        totalMiles: selectedRow["MilesCollected"] ?? "",
        imageCheck: selectedRow["FLImageCheck"] ?? "",
        rawStart: selectedRow["RawFilesProcessedStart"] ?? "",
        rawEnd: selectedRow["RawFilesProcessedEnd"] ?? "",
        offsetFixed: selectedRow["BEOffsetFixed"] ?? "",
        weather: selectedRow["Weather"] ?? "",
        airTemp: selectedRow["AirTemperature"] ?? "",

        autocrackStart: selectedRow["AutocrackStart"] ?? "",
        autocrackEnd: selectedRow["AutocrackEnd"] ?? "",
        autoclassStart: selectedRow["AutoclassStart"] ?? "",
        autoclassEnd: selectedRow["AutoclassEnd"] ?? "",
        tenthMileReport: selectedRow["TenthMileReport"] ?? "",
        pathviewVersion: selectedRow["PathviewVersion"] ?? "",
        dateBackedUp: selectedRow["DataBackedup"] ?? "",
        drivesFormatted: selectedRow["DrivesFormatted"] ?? "",
        missingSets: selectedRow["MissingSets"] ?? "",
        retestRequired: selectedRow["RetestRequired"] === true ||
                selectedRow["RetestRequired"] === 1 ||
                selectedRow["RetestRequired"] === "true",
        retestSets: selectedRow["RetestSets"] ?? "",
        pavementTemp: selectedRow["PavementTemperature"] ?? "",
        comments: selectedRow["Comments"] ?? "",
        collectionIssues: selectedRow["CollectionIssues"] ?? "",
        truckNum: selectedRow["TruckNum"] ?? ""
      }));
      return;
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value
    }));

    // if (type === 'checkbox') {
    //   console.log(`${name}: ${checked}`)
    // } else {
    //   console.log(`${name}: ${value}`)
    // }
  }

  const {
    data: inputTables,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['inputTables'],
    queryFn: getStatusInputTables
  });

  const assignedUserOptions = useMemo(() => {
      const users = inputTables?.users ?? [];

      return [...new Set([
          ...users.map(u => u.UserName),
          formData.assignedTo,
      ])].filter(Boolean);
  }, [inputTables?.users, formData.assignedTo]);
  
  const handleSubmit = async() => {
    const payload = { ...formData };

    const res = formData.recordType === "New Record" ? await insertNewStatus(payload) : await updateExistingStatus(payload);

    alert(res.message);
  };

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
          <select name="collectionYear" value={formData.collectionYear} onChange={handleField} className="w-full border p-2 rounded bg-white">
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
          </select>
        </div>

        <div className="w-64">
          <label className="block text-sm mb-1 font-bold">
              Sets
          </label>
          <select name="sets" value={formData.sets} onChange={handleField} className={`w-full border p-2 rounded bg-white ${formData.recordType === "New Record" ? "opacity-50 cursor-not-allowed" : ""}`} disabled={formData.recordType === "New Record"}>
              <option value="">-- Select --</option>
              
              {inputTables?.collectionLog
                .filter((item) => item["CollectionYear"] === Number(formData.collectionYear))
                .sort((a, b) => a["SetNum"].localeCompare(b["SetNum"]))
                .map((item, index) => (
                  <option key={`set-${index}`} value={item["SetNum"]}>
                    {item["SetNum"]}
                  </option>
                ))
              }
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
              <input name="SDIFileName" value={formData.SDIFileName} onChange={handleField} className={`w-71 border p-2 rounded bg-white`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Sets Received *
              </label>
              <input name="setsReceived" value={formData.setsReceived} onChange={handleField} className={`w-71 border p-2 rounded bg-white`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Date Received
              </label>
              <input type="date" name="dateReceived" value={formData.dateReceived} onChange={handleField} className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Date Collected
              </label>
              <input type="date" name="dateCollected" value={formData.dateCollected} onChange={handleField} className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Assigned To
              </label>
              <select name="assignedTo" value={formData.assignedTo} onChange={handleField} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
                  
                  {formData.recordType === "New Record" ? inputTables?.users.map((item, index) => (
                    <option key={`userName-${index}`} value={item.UserName}>
                      {item.UserName}
                    </option>
                  )) : assignedUserOptions.map((item, index) => (
                    <option key={`userName-${index}`} value={item}>
                      {item}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Total Miles
              </label>
              <input name="totalMiles" value={formData.totalMiles} onChange={handleField} className={`w-71 border p-2 rounded bg-white`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  First/Last Image Check
              </label>
              <input type="date" name="imageCheck" value={formData.imageCheck} onChange={handleField} className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Raw Files Processed Start Date
              </label>
              <input type="date" name="rawStart" value={formData.rawStart} onChange={handleField} className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Raw Files Processed End Date
              </label>
              <input type="date" name="rawEnd" value={formData.rawEnd} onChange={handleField} className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Beginning/Ending Offset Fixed
              </label>
              <input type="date" name="offsetFixed" value={formData.offsetFixed} onChange={handleField} className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Weather
              </label>
              <select name="weather" value={formData.weather} onChange={handleField} className={`w-71 border p-2 rounded bg-white`}>
                  <option value="">-- Select --</option>
                  <option value="Sunny">Sunny</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Overcast">Overcast</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Air Temperature
              </label>
              <input name="airTemp" value={formData.airTemp} onChange={handleField} className={`w-71 border p-2 rounded bg-white`} />
            </div>
          </div>
            
          {/* Middle Column */}
          <div className="space-y-2">
            <div>
              <label className="block text-sm mb-1 font-bold">
                  Autocrack Run Start Date
              </label>
              <input type="date" name="autocrackStart" value={formData.autocrackStart} onChange={handleField} className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Autocrack Run End Date
              </label>
              <input type="date" name="autocrackEnd" value={formData.autocrackEnd} onChange={handleField} className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Autoclass Run Start Date
              </label> 
              <input type="date" name="autoclassStart" value={formData.autoclassStart} onChange={handleField} className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Autoclass Run End Date
              </label>
              <input type="date" name="autoclassEnd" value={formData.autoclassEnd} onChange={handleField} className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  10th Mile Report Generated
              </label>
              <input type="date" name="tenthMileReport" value={formData.tenthMileReport} onChange={handleField} className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Pathview Version
              </label>
              <select name="pathviewVersion" value={formData.pathviewVersion} onChange={handleField} className={`w-71 border p-2 rounded bg-white`}>
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
              <input type="date" name="dateBackedUp" value={formData.dateBackedUp} onChange={handleField} className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Drives Formatted
              </label>
              <input type="date" name="drivesFormatted" value={formData.drivesFormatted} onChange={handleField} className={`w-71 border p-2 rounded bg-white h-9`} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Missing Sets
              </label>
              <input name="missingSets" value={formData.missingSets} onChange={handleField} className={`w-71 border p-2 rounded bg-white`} />
            </div>
            
            <div className="mb-3.5">
              <label className="block text-sm mb-1 font-bold">
                Retest Required
              </label>

              <input
                type="checkbox"
                name="retestRequired"
                checked={formData.retestRequired}
                onChange={handleField}
                className="h-4 w-4 accent-blue-600 mt-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Retest Sets
              </label>
              <input type="text" name="retestSets" value={formData.retestSets} onChange={handleField} className={`w-71 border p-2 rounded bg-white ${formData.retestRequired === false ? "opacity-50 cursor-not-allowed" : ""}`} disabled={formData.retestRequired === false} />
            </div>

            <div>
              <label className="block text-sm mb-1 font-bold">
                  Pavement Temperature
              </label>
              <input name="pavementTemp" value={formData.pavementTemp} onChange={handleField} className={`w-71 border p-2 rounded bg-white`} />
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
              <textarea name="comments" value={formData.comments} onChange={handleField} className="w-full border p-2 rounded h-32 bg-white" />
            </div>

            <div className="w-128">
              <label className="block text-sm mb-1 font-bold">
                  Collection Issues
              </label>
              <textarea name="collectionIssues" value={formData.collectionIssues} onChange={handleField} className="w-full border p-2 rounded h-32 bg-white" />
            </div>

            {/* Button */}
            <div className="mt-8 flex justify-center">
                <button type="button" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600" onClick={handleSubmit}>
                  {formData.recordType === "New Record" ? "Add New" : "Update Existing"}
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