"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { getUserById, updateUser, UserDTO } from "@/services/userService";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editUrl, setEditUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserById(user.userId)
      .then(setProfile)
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateUser(user.userId, {
        profilePictureUrl: editUrl,
      });
      setProfile(updated);
      setShowModal(false);
    } catch {
      setSaveError("Failed to update profile picture. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading profile…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-red-500">{error ?? "Profile not found."}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
          {/* Avatar */}
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
            <button
              onClick={() => {
                setEditUrl(profile.profilePictureUrl ?? "");
                setSaveError(null);
                setShowModal(true);
              }}
              className="text-xs text-blue-500 hover:underline"
            >
              Edit photo
            </button>
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Name
              </p>
              <p className="mt-1 text-base font-medium text-gray-800">
                {profile.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Email
              </p>
              <p className="mt-1 text-base text-gray-800">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Roles
              </p>
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

      {/* Edit photo modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-base font-semibold text-gray-800">
              Update Profile Picture
            </h2>
            <input
              type="url"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
            {saveError && (
              <p className="mt-2 text-xs text-red-500">{saveError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
