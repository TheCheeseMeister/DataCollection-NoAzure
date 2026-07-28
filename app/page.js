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

import { getUser } from "./utils/supabase/login-queries";

const modules = [AllCommunityModule];
const queryClient = new QueryClient();

export default function Tabs() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true);

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
    const restoreLogin = async () => {
      const savedUserID = localStorage.getItem("userID");

      if (savedUserID) {
        try {
          const user = await getUser(savedUserID);

          if (user) {
            setUserInfo(user);
            setLoggedIn(true);
          } else {
            localStorage.removeItem("userID");
          }
        } catch (error) {
          console.error(error);
          localStorage.removeItem("userID");
        }
      }

      setCheckingLogin(false);
    };

    restoreLogin();
  }, []);

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

  const handleLogout = () => {
    setUserInfo(false);
    setLoggedIn(false);
    setActiveTab("home");

    // Gets rid of past user login info
    localStorage.removeItem("userID");
  };

  if (checkingLogin) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-200">
        <p className="text-black text-xl">Loading...</p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <Login
        onLogin={(user) => {
          setUserInfo(user);
          setLoggedIn(true);
          localStorage.setItem("userID", user.UserID);
        }}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOnline ? "max-h-0 opacity-0 -translate-y-full" : "max-h-12 opacity-100 translate-y-0"}`}>
        <div className="bg-red-600 text-white text-center p-2 font-bold">
          You are currently offline. Database operations are unavailable.
        </div>
      </div>

      <AgGridProvider modules={modules}>
        <QueryClientProvider client={queryClient}>
          <div className="bg-gray-400 h-screen flex flex-col">
            <div className="relative flex items-center justify-center bg-blue-500 h-16 w-full mb-2">
              {/* NJDOT Header */}
              <div className="flex items-center gap-4">
                <img
                  src="/DataCollection-NoAzure/images/njdot_img.png"
                  className="h-14 w-auto"
                />
                <h1 className="text-4xl text-white font-bold">
                  NJDOT Data Collection
                </h1>
              </div>

              {/* User Info */}
              <div className="absolute right-4 flex items-center gap-4 text-white">
                <div className="text-right">
                  <div className="font-bold">
                    {userInfo?.UserID}
                  </div>
                  <div className="text-sm">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white font-semibold"
                >
                  Log Out
                </button>
              </div>
            </div>

            <div className="flex-1 bg-white m-2 text-black overflow-hidden">
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
    </div>
  );
}