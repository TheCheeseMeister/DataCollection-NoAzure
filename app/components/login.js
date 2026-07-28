"use client";

export default function Login({ onLogin }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          NJDOT Data Collection
        </h2>

        <input
          type="text"
          placeholder="Username"
          className="w-full border p-2 mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 mb-6"
        />

        <button
          onClick={onLogin}
          className="w-full bg-blue-600 text-white p-2"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}