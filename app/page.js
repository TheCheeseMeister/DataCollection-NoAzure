"use client";

import React, { useState, useEffect } from "react";

import Login from "./components/login";
import Home from "./components/home";
import Test from "./components/test";
import Collection from "./components/collection";
import Processing from "./components/processing";
import QAReview from "./components/qareview";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { AllCommunityModule } from "ag-grid-community";
import { AgGridProvider } from "ag-grid-react";

const modules = [AllCommunityModule];
const queryClient = new QueryClient();

export default function Tabs() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [isOnline, setIsOnline] = useState(true);

  const getPageTitle = () => {
    switch (activeTab) {
      case "test":
        return "Equipment QA";
      case "network":
        return "Network Collection";
      case "process":
        return "Processing Checker";
      case "qa":
        return "QA Review";
      case "skid":
        return "Skid Processing";
      default:
        return "";
    }
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOnline ? "max-h-0 opacity-0 -translate-y-full" : "max-h-12 opacity-100 translate-y-0"}`}>
        <div className="bg-red-600 text-white text-center p-2 font-bold">
          You are currently offline. Database operations are unavailable.
        </div>
      </div>

      <AgGridProvider modules={modules}>
        <QueryClientProvider client={queryClient}>
          <div className="bg-gray-400 h-screen flex flex-col">
            {/* Main Header */}
            <div className="mx-auto flex justify-center items-center bg-blue-500 h-16 w-full mb-2 gap-4">
              <img src='/DataCollection-NoAzure/images/njdot_img.png' className="h-14 w-auto" />
              <h1 className="text-4xl text-white font-bold">NJDOT Data Collection</h1>
            </div>

            <div className="flex-1 bg-white m-2 text-black">
              {activeTab === "home" ? (
                <Home setActiveTab={setActiveTab} />
              ) : (

                <div className="h-full flex flex-col">
                  {/* Navigation Bar */}
                  <div className="flex items-center justify-between bg-gray-100 border-b border-gray-300 px-5 h-12">
                    <button
                      onClick={() => setActiveTab("home")}
                      className="text-blue-700 font-semibold hover:underline"
                    >
                      ← Home
                    </button>

                    <h2 className="text-xl font-bold">
                      {getPageTitle()}
                    </h2>

                    <div className="w-20"></div>
                  </div>

                  {/* Application */}
                  <div className="flex-1 overflow-hidden">
                    {activeTab === "test" && <Test />}
                    {activeTab === "network" && <Collection />}
                    {activeTab === "process" && <Processing />}
                    {activeTab === "qa" && <QAReview />}
                    {activeTab === "skid" && (
                      <div className="p-6">
                        <h2 className="text-2xl font-bold">
                          Skid Processing
                        </h2>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </AgGridProvider>
    </>
  );
}