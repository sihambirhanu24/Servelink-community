"use client";

import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { LogOut, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSuspensionStatus } from "@/hooks/useSuspensionStatus";

export default function SidebarFooter() {
  const { user, logout } = useAuth();
  const { suspensionStatus } = useSuspensionStatus(user?.id);

  return (
    <div className="border-t border-gray-200 pt-6">

      <div className="mb-6 flex items-center gap-3">

        <Avatar
          name={user?.firstName || "Teacher"}
          image={user?.profileImage}
        />

        <div className="flex-1 min-w-0">

          <h3 className="font-semibold text-[#043658] truncate">
            {user?.firstName} {user?.lastName}
          </h3>

          <p className="text-sm text-gray-500 truncate">
            {user?.level}
          </p>

          {suspensionStatus?.isSuspended && (
            <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span className="truncate">Account Suspended</span>
            </div>
          )}

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