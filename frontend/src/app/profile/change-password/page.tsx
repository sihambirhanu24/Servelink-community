"use client";

import { useState } from "react";
import { changePassword } from "@/services/profile";
import { useRouter } from "next/navigation";
import BackButton from "@/components/common/BackButton";


export default function ChangePasswordPage() {
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      await changePassword(oldPassword, newPassword);

      alert("Password changed successfully!");

      router.push("/profile");
    }catch (error: any) {
  console.log("Change Password Error:", error);
  console.log("Status:", error.response?.status);
  console.log("Data:", error.response?.data);

  alert("Failed to change password");
} finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <BackButton />
        <h1 className="mb-6 text-3xl font-bold text-slate-800">
          Change Password
        </h1>

        <input
          type="password"
          placeholder="Current Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border p-3 text-slate-700"
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mb-6 w-full rounded-lg border p-3 text-slate-700"
        />

        <button
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {loading ? "Updating..." : "Change Password"}
        </button>
      </form>

    </main>
  );
}