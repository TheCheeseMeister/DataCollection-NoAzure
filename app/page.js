"use client";

import React, {useEffect, useState} from 'react';
import Home from "./components/home";
import Test from "./components/test";
import Collection from "./components/collection";
import Processing from "./components/processing";
import QAReview from "./components/qareview";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { AllCommunityModule } from 'ag-grid-community';
import { AgGridProvider } from 'ag-grid-react';

const modules = [AllCommunityModule];

const queryClient = new QueryClient();

export default function Tabs() {
  const tabs = [
    { id: "home", label: "Home", content: <Home />},
    { id: "test", label: "Equipment QA", content: <Test />},
    { id: "network", label: "Network Collection", content: <Collection />},
    { id: "process", label: "Processing Checker", content: <Processing />},
    { id: "qa", label: "QA Review", content: <QAReview />},
    { id: "skid", label: "Skid Processing", content: "Skid"},
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <AgGridProvider modules={modules}>
      <QueryClientProvider client={queryClient}>
        <div className="bg-gray-400 min-h-screen flex flex-col">
          {/* Header */}
          <div className="mx-auto flex justify-center items-center bg-blue-500 h-16 w-full mb-2 gap-4">
            <img src='/DataCollection-NoAzure/images/njdot_img.png' className="h-14 w-auto" />
            <h1 className="text-4xl text-white font-bold">NJDOT Data Collection</h1>
          </div>

          {/* Body */}
          <div className="flex flex-1 mb-2">
            {/* Tabs */}
            <div className="items-start flex flex-col gap-x-10 bg-gray-400">
              {tabs.map((tab) => (
                <button className=
                {
                  `text-black border-2 text-center w-42 h-12 
                  ${activeTab === tab.id ? "bg-blue-200 bold hover:bg-blue-300" : "bg-white hover:bg-gray-300"}`
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

            {/* Content */}
            <div className="bg-white w-full ml-2 mr-2">
              {tabs.find(t => t.id === activeTab)?.content}
            </div>
          </div>
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </AgGridProvider>
  );
}


/*"use client";

import { useEffect, useState } from "react";
import { supabase } from "./utils/supabase/client";

export default function Home() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchData = async () => {
    console.log("FETCH START");

    const { data, error } = await supabase
      .from("tblCertificateVerificationResult")
      .select("*");

    setData(data);
    console.log("DONE", { data, error });
  };

  fetchData();
}, []);

  return(
    <div>
      <h1>Supabase Results</h1>

      {error && <p>Error: {error}</p>}

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}*/