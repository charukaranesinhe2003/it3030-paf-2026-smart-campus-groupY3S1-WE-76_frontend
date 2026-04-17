"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAllBookings } from "@/services/bookingApi";
import BookingCard from "@/components/BookingCard";
import ToastContainer from "@/components/ToastContainer";

type Status = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type Booking = {
  id: number;
  userId: string;
  resourceName: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  purpose?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
};

type Analytics = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  mostUsedResource: string;
};

const TABS: Status[] = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export default function AdminPanel() {
  const [tab, setTab] = useState<Status>("ALL");
  const [data, setData] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    mostUsedResource: "N/A",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const computeAnalytics = useCallback((bookings: Booking[]): Analytics => {
    const resourceCounts: Record<string, number> = {};

    for (const booking of bookings) {
      resourceCounts[booking.resourceName] = (resourceCounts[booking.resourceName] || 0) + 1;
    }

    const mostUsedResource =
      Object.entries(resourceCounts)
        .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))[0]?.[0] || "N/A";

    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "PENDING").length,
      approved: bookings.filter((b) => b.status === "APPROVED").length,
      rejected: bookings.filter((b) => b.status === "REJECTED").length,
      mostUsedResource,
    };
  }, []);

  const fetchBookings = useCallback(async (status: Status) => {
    setLoading(true);
    setError("");
    try {
      const [filteredRes, allRes] = await Promise.all([
        getAllBookings(status === "ALL" ? null : status),
        getAllBookings(null),
      ]);
      setData(filteredRes.data);
      setAnalytics(computeAnalytics(allRes.data));
    } catch {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [computeAnalytics]);

  useEffect(() => {
    fetchBookings(tab);
  }, [tab, fetchBookings]);

  return (
    <ToastContainer>
      <div className="page-wrap">
        <h1 className="page-title">
          Admin <span>Panel</span>
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div className="card" style={{ padding: "12px" }}>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Total Bookings</div>
            <div style={{ fontSize: "22px", fontWeight: 700 }}>{analytics.total}</div>
          </div>
          <div className="card" style={{ padding: "12px" }}>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Pending</div>
            <div style={{ fontSize: "22px", fontWeight: 700 }}>{analytics.pending}</div>
          </div>
          <div className="card" style={{ padding: "12px" }}>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Approved</div>
            <div style={{ fontSize: "22px", fontWeight: 700 }}>{analytics.approved}</div>
          </div>
          <div className="card" style={{ padding: "12px" }}>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Rejected</div>
            <div style={{ fontSize: "22px", fontWeight: 700 }}>{analytics.rejected}</div>
          </div>
          <div className="card" style={{ padding: "12px" }}>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Most Used Resource</div>
            <div style={{ fontSize: "18px", fontWeight: 700 }}>{analytics.mostUsedResource}</div>
          </div>
        </div>

        <div className="tab-bar">
          {TABS.map((t) => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {loading && <div className="loader">Loading…</div>}

        {!loading && data.length === 0 && (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>
              No bookings with status <strong>{tab}</strong>.
            </p>
          </div>
        )}

        {data.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            isAdmin={true}
            currentUserId={""}
            onRefresh={() => fetchBookings(tab)}
          />
        ))}
      </div>
    </ToastContainer>
  );
}