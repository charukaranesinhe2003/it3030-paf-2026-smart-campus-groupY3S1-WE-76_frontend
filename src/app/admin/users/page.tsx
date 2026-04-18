"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getAllUsers, updateUser, UserDTO } from "@/services/userService";

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <AdminUsersContent />
    </ProtectedRoute>
  );
}

function AdminUsersContent() {
  const router = useRouter();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role change state
  const [changingRoleFor, setChangingRoleFor] = useState<number | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch(() => setError("Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  const handlePromoteToTechnician = async (userId: number) => {
    setChangingRoleFor(userId);
    setRoleError(null);
    try {
      const updated = await updateUser(userId, { role: "ROLE_TECHNICIAN" });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch {
      setRoleError(`Failed to update role for user ${userId}.`);
    } finally {
      setChangingRoleFor(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading users…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all users and promote them to Technician role.
          </p>
        </div>

        {roleError && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">
            {roleError}
          </div>
        )}

        {/* Users table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Roles</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="cursor-pointer transition hover:bg-gray-50"
                  onClick={() => router.push(`/profile/${u.id}`)}
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {u.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                        >
                          {role.replace("ROLE_", "")}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 text-right"
                    onClick={(e) => e.stopPropagation()} // prevent row click
                  >
                    {!u.roles.includes("ROLE_TECHNICIAN") &&
                    !u.roles.includes("ROLE_ADMIN") ? (
                      <button
                        onClick={() => handlePromoteToTechnician(u.id)}
                        disabled={changingRoleFor === u.id}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-60"
                      >
                        {changingRoleFor === u.id
                          ? "Updating…"
                          : "Make Technician"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-400">
              No users found.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
