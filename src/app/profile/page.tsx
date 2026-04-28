"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

function getInitials(email: string): string {
  const name = email.split("@")[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarGradient(email: string): string {
  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-rose-600",
    "from-cyan-500 to-blue-600",
    "from-pink-500 to-rose-600",
  ];
  const index = email.charCodeAt(0) % gradients.length;
  return gradients[index];
}

function RoleBadge({ role }: { role: string }) {
  const label = role.replace("ROLE_", "");
  const isAdmin = label === "ADMIN";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        isAdmin
          ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
          : "bg-blue-100 text-blue-800 ring-1 ring-blue-200"
      }`}
    >
      <span className="text-[10px]">{isAdmin ? "★" : "●"}</span>
      {label}
    </span>
  );
}

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!user) return null;

  const initials = getInitials(user.email);
  const gradient = getAvatarGradient(user.email);
  const username = user.email.split("@")[0];
  const domain = user.email.split("@")[1];
  const isAdmin = user.roles.includes("ROLE_ADMIN");

  return (
    <main className="flex flex-1 items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-4">

        {/* Hero card */}
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200">
          {/* Banner */}
          <div className={`h-28 bg-gradient-to-br ${gradient} opacity-90`} />

          {/* Avatar */}
          <div className="px-6 pb-6">
            <div className="relative -mt-12 mb-4 flex items-end justify-between">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-2xl font-bold text-white shadow-lg ring-4 ring-white`}
              >
                {initials}
              </div>
              {isAdmin && (
                <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                  ★ Admin
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-gray-900">{username}</h1>
            <p className="mt-0.5 text-sm text-gray-500">@{domain}</p>
          </div>
        </div>

        {/* Details card */}
        <div className="rounded-3xl bg-white shadow-sm ring-1 ring-gray-200 divide-y divide-gray-100">
          <div className="px-6 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Account Details
            </p>
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Email address</p>
                  <p className="truncate text-sm font-medium text-gray-900">{user.email}</p>
                </div>
              </div>

              {/* User ID */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">User ID</p>
                  <p className="text-sm font-medium text-gray-900">#{user.userId}</p>
                </div>
              </div>

              {/* Roles */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Roles</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {user.roles.map((role) => (
                      <RoleBadge key={role} role={role} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/my-bookings"
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">My Bookings</p>
              <p className="text-xs text-gray-400">View history</p>
            </div>
          </Link>

          <Link
            href="/create-booking"
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">New Booking</p>
              <p className="text-xs text-gray-400">Reserve a resource</p>
            </div>
          </Link>
        </div>

      </div>
    </main>
  );
}
