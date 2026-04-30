"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "./NotificationBell";

interface NavItem {
  href: string;
  label: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",               label: "Resources"       },
  { href: "/create-booking", label: "+ New Booking"   },
  { href: "/incidents",      label: "Report Incident" },
  { href: "/my-bookings",    label: "My Bookings"     },
  { href: "/admin-panel",    label: "Bookings Admin", roles: ["ROLE_ADMIN"] },
  { href: "/admin/users",    label: "Users",          roles: ["ROLE_ADMIN"] },
];

export default function AppNavbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/login") return null;

  const visibleItems = NAV_ITEMS.filter(
    item => !item.roles || item.roles.some(r => user?.roles.includes(r))
  );

  return (
    <nav
      className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Desktop bar */}
      <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="mr-4 text-base font-bold tracking-tight text-blue-600 flex-shrink-0">
          📚 Smart Campus
        </Link>

        {/* Desktop nav links — hidden on mobile */}
        <div className="hidden flex-1 items-center gap-1 md:flex">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Spacer on mobile */}
        <div className="flex-1 md:hidden" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated && <NotificationBell />}

          {isAuthenticated && (
            <Link
              href="/profile"
              aria-label="My profile"
              className={`hidden rounded-lg px-3 py-1.5 text-sm font-medium transition sm:block ${
                pathname === "/profile"
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              {user?.email?.split("@")[0] ?? "Profile"}
            </Link>
          )}

          {isAuthenticated && (
            <button
              onClick={logout}
              aria-label="Sign out"
              className="hidden rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 sm:block"
            >
              Sign out
            </button>
          )}

          {!isAuthenticated && (
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign in
            </Link>
          )}

          {/* Hamburger — visible on mobile only */}
          <button
            onClick={() => setMobileOpen(prev => !prev)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {isAuthenticated && (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Profile
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
