"use client";

import { useState, useEffect } from "react";

import { getAllUsers, updateUserPassword } from "../utils/supabase/login-queries";

export default function Login({ onLogin }) {
  const [changePassword, setChangePassword] = useState("");
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getAllUsers();
        const sortedUsers = data.sort((a, b) =>
          a.UserID.localeCompare(b.UserID)
        );

        setUsers(sortedUsers);
      } catch (err) {
        throw err;
      }
    };

    loadUsers();
  }, []);

  const createPasswordFromCode = (passcode) => {
    const icp = parseInt(passcode.slice(-1)) % 2 == 0 ? 5 : 4;

    passcode = passcode.substring(0, passcode.length - 1);

    const codeLength = passcode.length / icp - 1
    const shifts = new Array(codeLength + 1);
    const charCodes = new Array(codeLength + 1);

    for (let i = 0; i <= codeLength; i++) {
      shifts[i] = i - (codeLength + 1);
    }

    for (let intChar = 0; intChar <= codeLength; intChar++) {
      for (let intCode = 0; intCode <= codeLength; intCode++) {
        if (parseInt(passcode.substring(intCode * icp, intCode * icp + (icp - 3)), 10) === intChar) {
          const code = parseInt(passcode.substring((intCode + 1) * icp - 3, (intCode + 1) * icp), 10);

          charCodes[intChar] = code + shifts[intChar];
          break;
        }
      }
    }

    let password = "";
    for (let i = 0; i <= codeLength; i++) {
      password += String.fromCharCode(charCodes[i]);
    }

    return password;
  };

  function createCodeFromPassword(password) {
    const pwLen = password.length - 1;
    const scp = pwLen < 10 ? "0" : "00";
    const icp = pwLen < 10 ? Math.floor(Math.random() * 5 + 1) * 2 - 1 : Math.floor(Math.random() * 5 + 1) * 2;

    const shifts = new Array(pwLen + 1);
    const charCodes = new Array(pwLen + 1);
    const pw = [];
    const rnd = [];

    for (let i = 0; i <= pwLen; i++) {
      rnd[i] = i;
    }

    for (let i = 0; i <= pwLen; i++) {
      const randIndex = Math.floor(Math.random() * (pwLen - i + 1)) + i;

      if (i !== randIndex) {
        const temp = rnd[i];
        rnd[i] = rnd[randIndex];
        rnd[randIndex] = temp;
      }
    }

    for (let i = 0; i <= pwLen; i++) {
      pw[i] = password.substring(i, i + 1);
      shifts[i] = i - (pwLen + 1);
    }

    for (let i = 0; i <= pwLen; i++) {
      const location = rnd.indexOf(i);
      charCodes[location] = pw[i].charCodeAt(0) - shifts[i];
    }

    let result = "";
    for (let i = 0; i <= pwLen; i++) {
      result += String(rnd[i]).padStart(scp, "0");
      result += String(charCodes[i]).padStart(3, "0");
    }

    return result += icp;
  }

  const validateNewPassword = (password) => {
    if (password.length < 5 || password.length > 10) {
      return "Password must be 5 to 10 characters in length.";
    }

    if (/(.)\1\1/.test(password)) {
      return "Password cannot contain 3 or more of the same character in a row.";
    }

    return "";
  };

  const handleLogin = async () => {
    setError("");

    // Login Attempt
    if (!changePassword) {
      const userData = users.find((user) => user.UserID === username);
      if (!userData) {
        setError("Could not find user/User may not have an 'Active' account.");
        return;
      }

      const matchingPassword = createPasswordFromCode(userData.Password);

      if (password === matchingPassword) {
        // Log user in
        if (userData.PassExpired) {
          setError("Your password has expired. Please create a new one.")
          return;
        }

        onLogin(userData);
      } else {
        setError("Wrong password.");
      }
    } else {
      // Change Password Attempt
      if (username === "" || password === "" || newPassword === "" || confirmNewPassword === "") {
        setError("You must fill in all empty fields to continue.");
        return;
      }

      const passError = validateNewPassword(newPassword);
      if (passError) {
        setError(passError);
        return;
      }

      const userData = users.find((user) => user.UserID === username);
      if (!userData) {
        setError("Could not find user/User may not have an 'Active' account.");
        return;
      }

      const matchingPassword = createPasswordFromCode(userData.Password);

      if (password !== matchingPassword) {
        setError("Incorrect old password.");
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setError("New Passwords do not match.");
        return;
      }

      const newCode = createCodeFromPassword(newPassword);
      await updateUserPassword(username, newCode);

      alert("Password change successful!");

      setPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setChangePassword(false);

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.UserID === username
            ? { ...user, Password: newCode, PassExpired: false }
            : user
        )
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">
          NJDOT Data Collection
        </h2>

        <select
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={`w-full rounded border border-gray-500 p-2 mb-4 ${username ? "text-black" : "text-gray-500"
            }`}
        >
          <option value="" disabled>
            Select Username
          </option>

          {users.map((user) => (
            <option key={user.UserID} value={user.UserID} className="text-black">
              {user.UserID}
            </option>
          ))}
        </select>

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          autoComplete="off"
          className="w-full rounded border border-gray-500 p-2 mb-6 text-black"
        />

        <div className={`grid transition-all duration-300 ease-in-out ${changePassword ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="New Password"
              autoComplete="off"
              className="w-full rounded border border-gray-500 p-2 mb-4 text-black"
            />

            <input
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              type="password"
              placeholder="Confirm New Password"
              autoComplete="off"
              className="w-full rounded border border-gray-500 p-2 mb-6 text-black"
            />
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 text-center">
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          className="w-full rounded bg-blue-600 text-white p-2"
        >
          {changePassword ? "Update Password" : "Sign In"}
        </button>

        <button
          onClick={() => {
            if (changePassword) {
              setChangePassword(false);
            } else {
              setChangePassword(true);
            }
          }}
          className="mt-3 w-full rounded border border-gray-400 p-2 text-gray-700 hover:bg-gray-100"
        >
          {changePassword ? "Cancel Update" : "Change Password"}
        </button>
      </div>
    </div>
  );
}