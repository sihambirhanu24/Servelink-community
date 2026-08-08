"use client";

import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SidebarFooter() {
  const { user, logout } = useAuth();

  return (
    <div className="border-t border-gray-200 pt-6">

      <div className="mb-6 flex items-center gap-3">

        <Avatar
          name={user?.firstName || "Teacher"}
          image={user?.profileImage}
        />

        <div>

          <h3 className="font-semibold text-[#043658]">
            {user?.firstName} {user?.lastName}
          </h3>

          <p className="text-sm text-gray-500">
            {user?.level}
          </p>

        </div>

      </div>

      <Button
        onClick={logout}
        className="flex w-full items-center justify-center gap-2"
      >
        <LogOut size={18} />

        Logout

      </Button>

    </div>
  );
}