"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ResourceTable from "../components/ResourceTable";
import { deleteResource, getAllResources, Resource } from "../services/resourceService";
import { useAuth } from "@/context/AuthContext";

// Inline toast state — avoids adding ToastContainer dependency to the home page
type Toast = { id: number; message: string; type: "success" | "error" };

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    loadResources();
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const loadResources = async () => {
    setLoading(true);
    try {
      const response = await getAllResources();
      setResources(Array.isArray(response.data) ? response.data : []);
    } catch {
      showToast("Failed to load resources", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await deleteResource(deleteConfirmId);
      setResources(prev => prev.filter(r => r.id !== deleteConfirmId));
      showToast("Resource deleted successfully", "success");
    } catch {
      showToast("Failed to delete resource", "error");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const filteredResources = resources.filter((r) => {
    const type = r.type?.toLowerCase() ?? "";
    const location = r.location?.toLowerCase() ?? "";
    return type.includes(searchType.toLowerCase()) && location.includes(searchLocation.toLowerCase());
  });

  const activeCount = resources.filter(r => r.status === "ACTIVE").length;
  const outOfServiceCount = resources.filter(r => r.status === "OUT_OF_SERVICE").length;

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Toast notifications */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg transition ${
                t.type === "success" ? "bg-emerald-600" : "bg-red-600"
              }`}
            >
              {t.type === "success" ? "✓" : "⚠"} {t.message}
            </div>
          ))}
        </div>

        {/* Delete confirmation modal */}
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-base font-bold text-gray-900 mb-2">Delete Resource</h3>
              <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete this resource? This cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome banner (shown when authenticated) */}
        {isAuthenticated && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-sm">
            <p className="text-sm font-medium opacity-80">Welcome back</p>
            <h2 className="text-xl font-bold mt-0.5">{user?.email?.split("@")[0] ?? "User"}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/create-booking" className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/30 transition">
                + New Booking
              </Link>
              <Link href="/my-bookings" className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/30 transition">
                My Bookings
              </Link>
            </div>
          </div>
        )}

        {/* Summary stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Resources</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{loading ? "—" : resources.length}</p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Active</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{loading ? "—" : activeCount}</p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Out of Service</p>
            <p className="mt-1 text-2xl font-bold text-red-500">{loading ? "—" : outOfServiceCount}</p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Filtered</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{loading ? "—" : filteredResources.length}</p>
          </div>
        </div>

        {/* Header + Add button */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-200 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Facilities & Assets Catalogue</h1>
            <p className="mt-1 text-sm text-gray-500">Manage lecture halls, labs, meeting rooms, and equipment</p>
          </div>
          <Link
            href="/add"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Add Resource
          </Link>
        </div>

        {/* Search filters */}
        <div className="mb-6 grid gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-200 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Search by Type</label>
            <input
              type="text"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              placeholder="e.g. Lab, Lecture Hall"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Search by Location</label>
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="e.g. Block A, Floor 2"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Resource table or skeleton */}
        {loading ? (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-100 border-b border-gray-200" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-50">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="h-4 w-12 rounded bg-gray-200" />
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="h-4 flex-1 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ResourceTable resources={filteredResources} onDelete={handleDelete} />
        )}
      </div>
    </main>
  );
}
