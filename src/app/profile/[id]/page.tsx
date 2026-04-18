"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getUserById, UserDTO } from "@/services/userService";

export default function UserProfilePage() {
  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <UserProfileContent />
    </ProtectedRoute>
  );
}

function UserProfileContent() {
  const params = useParams();
  const id = Number(params?.id);
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getUserById(id)
      .then(setProfile)
      .catch(() => setError("Failed to load user profile."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-red-500">{error ?? "User not found."}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
          <div className="mb-6 flex flex-col items-center gap-3">
            {profile.profilePictureUrl ? (
              <Image
                src={profile.profilePictureUrl}
                alt={profile.name}
                width={80}
                height={80}
                className="rounded-full object-cover ring-2 ring-blue-100"
                unoptimized
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Name</p>
              <p className="mt-1 text-base font-medium text-gray-800">{profile.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Email</p>
              <p className="mt-1 text-base text-gray-800">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Roles</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {profile.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {role.replace("ROLE_", "")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
