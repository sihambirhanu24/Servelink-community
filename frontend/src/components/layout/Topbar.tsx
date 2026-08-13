"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Transition } from "@headlessui/react";
import {
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/common/Avatar";
import { NotificationBell } from "@/components/notification/NotificationBell";
import { ChatRoomsDropdown } from "@/components/chat/ChatRoomsDropdown";

export default function Topbar() {
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const router = useRouter();

  // --------------------------------------------------
  // USER DATA
  // --------------------------------------------------

  const firstName = profile?.firstName ?? user?.firstName ?? "";
  const lastName = profile?.lastName ?? user?.lastName ?? "";

  const userName =
    `${firstName} ${lastName}`.trim() || "User";

  const levelLabel = (
    profile?.level ??
    user?.level ??
    ""
  )
    .toString()
    .replace(/_/g, " ");

  const profileImage: string | undefined =
    profile?.profileImage ??
    user?.profileImage ??
    undefined;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <header
      className="
        fixed
        top-0
        left-0
        lg:left-64
        right-0
        z-40
        h-16
        border-b
        border-white/10
        bg-gradient-to-b
        from-slate-900
        to-slate-800
        px-4
        sm:px-6
        lg:px-8
        flex
        items-center
        justify-between
        gap-4
      "
    >
      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div
        className="
          flex
          flex-1
          items-center
          gap-2
          rounded-lg
          border
          border-white/10
          bg-white/5
          px-3
          py-2
          transition-all
          focus-within:border-[#FFC107]/60
          focus-within:bg-white/10
          focus-within:ring-2
          focus-within:ring-[#FFC107]/20
          sm:max-w-sm
        "
      >
        <Search
          className="h-4 w-4 shrink-0 text-white/60"
          aria-hidden="true"
        />

        <input
          type="search"
          placeholder="Search communities..."
          aria-label="Search communities"
          className="
            min-w-0
            flex-1
            bg-transparent
            text-sm
            text-white
            placeholder:text-white/50
            outline-none
          "
        />
      </div>

      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <div className="flex items-center gap-1 sm:gap-2">

        {/* =================================================
            CREATE POST
        ================================================= */}

        <Link
          href="/posts"
          aria-label="Create post"
          title="Create Post"
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-[#FFC107]
            text-slate-900
            shadow-sm
            transition-all
            duration-200
            hover:bg-[#FFD54F]
            hover:shadow-md
            focus:outline-none
            focus:ring-2
            focus:ring-[#FFC107]/50
            focus:ring-offset-2
            focus:ring-offset-slate-800
          "
        >
          <Plus
            className="h-5 w-5"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </Link>

        {/* =================================================
            CHAT ROOMS
        ================================================= */}

        <div
          className="
            rounded-xl
            text-white
            [&_button]:text-white
            [&_svg]:text-white
          "
        >
          <ChatRoomsDropdown />
        </div>

        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <div
          className="
            rounded-xl
            text-white
            [&_button]:text-white
            [&_svg]:text-white
          "
        >
          <NotificationBell />
        </div>

        {/* =================================================
            DIVIDER
        ================================================= */}

        <div
          className="
            ml-1
            h-7
            w-px
            bg-white/15
            sm:ml-2
          "
          aria-hidden="true"
        />

        {/* =================================================
            PROFILE MENU
        ================================================= */}

        <Menu
          as="div"
          className="relative"
        >
          <Menu.Button
            id="topbar-avatar-btn"
            aria-label="Open account menu"
            className="
              group
              flex
              items-center
              gap-2.5
              rounded-xl
              px-2
              py-1.5
              transition-all
              duration-200
              hover:bg-white/10
              focus:outline-none
              focus:ring-2
              focus:ring-[#FFC107]/40
            "
          >
            {/* Avatar */}

            <div
              className="
                rounded-full
                ring-2
                ring-[#FFC107]
                ring-offset-1
                ring-offset-slate-800
              "
            >
              <Avatar
                name={userName}
                profileImage={profileImage}
                size="sm"
                showRing={false}
              />
            </div>

            {/* Name */}

            <span
              className="
                hidden
                max-w-[120px]
                truncate
                text-sm
                font-medium
                text-white
                sm:block
              "
            >
              {firstName || userName}
            </span>

            {/* Arrow */}

            <ChevronDown
              className="
                hidden
                h-3.5
                w-3.5
                shrink-0
                text-white/60
                transition-transform
                group-data-[open]:rotate-180
                sm:block
              "
              aria-hidden="true"
            />
          </Menu.Button>

          {/* =================================================
              DROPDOWN
          ================================================= */}

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items
              className="
                absolute
                right-0
                z-50
                mt-2
                w-60
                origin-top-right
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                bg-white
                shadow-xl
                focus:outline-none
              "
            >

              {/* ============================================
                  USER INFORMATION
              ============================================ */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                  border-b
                  border-slate-100
                  px-4
                  py-4
                "
              >
                <Avatar
                  name={userName}
                  profileImage={profileImage}
                  size="md"
                  showRing={false}
                />

                <div className="min-w-0">
                  <p
                    className="
                      truncate
                      text-sm
                      font-semibold
                      text-[#043658]
                    "
                  >
                    {userName}
                  </p>

                  {levelLabel && (
                    <p
                      className="
                        mt-1
                        truncate
                        text-xs
                        uppercase
                        tracking-wide
                        text-slate-400
                      "
                    >
                      {levelLabel}
                    </p>
                  )}
                </div>
              </div>

              {/* ============================================
                  MENU ITEMS
              ============================================ */}

              <div className="py-1">

                {/* PROFILE */}

                <Menu.Item>
                  {({ active }) => (
                    <button
                      id="topbar-menu-profile"
                      onClick={() => router.push("/profile")}
                      className={`
                        flex
                        w-full
                        items-center
                        gap-3
                        px-4
                        py-2.5
                        text-left
                        text-sm
                        transition-colors
                        focus:outline-none
                        ${
                          active
                            ? "bg-[#043658]/5 text-[#043658]"
                            : "text-slate-600"
                        }
                      `}
                    >
                      <User
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />

                      <span>Profile</span>
                    </button>
                  )}
                </Menu.Item>

                {/* SETTINGS */}

                <Menu.Item>
                  {({ active }) => (
                    <button
                      id="topbar-menu-settings"
                      onClick={() => router.push("/settings")}
                      className={`
                        flex
                        w-full
                        items-center
                        gap-3
                        px-4
                        py-2.5
                        text-left
                        text-sm
                        transition-colors
                        focus:outline-none
                        ${
                          active
                            ? "bg-[#043658]/5 text-[#043658]"
                            : "text-slate-600"
                        }
                      `}
                    >
                      <Settings
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />

                      <span>Settings</span>
                    </button>
                  )}
                </Menu.Item>

              </div>

              {/* ============================================
                  LOGOUT
              ============================================ */}

              <div className="border-t border-slate-100 py-1">

                <Menu.Item>
                  {({ active }) => (
                    <button
                      id="topbar-menu-logout"
                      onClick={logout}
                      className={`
                        flex
                        w-full
                        items-center
                        gap-3
                        px-4
                        py-2.5
                        text-left
                        text-sm
                        transition-colors
                        focus:outline-none
                        ${
                          active
                            ? "bg-red-50 text-red-600"
                            : "text-red-500"
                        }
                      `}
                    >
                      <LogOut
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />

                      <span>Sign out</span>
                    </button>
                  )}
                </Menu.Item>

              </div>

            </Menu.Items>
          </Transition>
        </Menu>

      </div>
    </header>
  );
}