"use client";

export default function Home({ setActiveTab }) {
  return (
    <div className="flex flex-col items-center h-full py-20">

      <h2 className="text-4xl text-black font-bold mb-10">
        Welcome to NJDOT Data Collection
      </h2>

      <div className="flex flex-col gap-5 w-96">

        <button
          onClick={() => setActiveTab("test")}
          className="rounded bg-blue-600 text-white p-4"
        >
          Equipment QA
        </button>

        <button
          onClick={() => setActiveTab("network")}
          className="rounded bg-blue-600 text-white p-4"
        >
          Network Collection
        </button>

        <button
          onClick={() => setActiveTab("process")}
          className="rounded bg-blue-600 text-white p-4"
        >
          Processing Checker
        </button>

        <button
          onClick={() => setActiveTab("qa")}
          className="rounded bg-blue-600 text-white p-4"
        >
          QA Review
        </button>

        <button
          onClick={() => setActiveTab("skid")}
          className="rounded bg-blue-600 text-white p-4"
        >
          Skid Processing
        </button>

      </div>
    </div>
  );
}