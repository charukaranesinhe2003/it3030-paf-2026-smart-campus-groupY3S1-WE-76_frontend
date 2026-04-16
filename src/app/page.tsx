"use client";

import { fetchHealth, fetchHello } from "@/services/api";
import { useState, useEffect } from "react";

export default function Home() {
  const [health, setHealth] = useState<string | null>(null);
  const [hello, setHello] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchHealth(), fetchHello()])
      .then(([healthResult, helloResult]) => {
        setHealth(healthResult);
        setHello(helloResult);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        PAF Frontend Running
      </h1>

      {loading && (
        <p className="text-gray-500 text-lg animate-pulse">Loading…</p>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 max-w-md w-full">
          <p className="font-semibold mb-1">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-4 w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Health
            </p>
            <p className="text-gray-800 text-lg">{health}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Hello
            </p>
            <p className="text-gray-800 text-lg">{hello}</p>
          </div>
        </div>
      )}
    </main>
  );
}
