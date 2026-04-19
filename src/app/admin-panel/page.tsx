"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAllBookings } from "@/services/bookingApi";
import BookingCard from "@/components/BookingCard";
import ToastContainer from "@/components/ToastContainer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import styles from "./AdminPanel.module.css";

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
  cancelled: number;
  mostUsedResource: string;
};

const TABS: Status[] = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export default function AdminPanel() {
  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <AdminPanelContent />
    </ProtectedRoute>
  );
}

function AdminPanelContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Status>("ALL");
  const [data, setData] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
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
      cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
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

  const tabCount = (status: Status) => {
    if (status === "ALL") return analytics.total;
    if (status === "PENDING") return analytics.pending;
    if (status === "APPROVED") return analytics.approved;
    if (status === "REJECTED") return analytics.rejected;
    return analytics.cancelled;
  };

  return (
    <ToastContainer>
      <div className={styles.pageShell}>
        <div className={styles.backdropOrbA}></div>
        <div className={styles.backdropOrbB}></div>

        <div className={styles.container}>
          <section className={styles.headerCard}>
            <div>
              <h1 className={styles.pageTitle}>Admin Panel</h1>
              <p className={styles.subtitle}>Review incoming requests, handle approvals, and monitor booking activity in real time.</p>
            </div>
          </section>

          <section className={styles.analyticsGrid}>
            <div className={`${styles.statCard} ${styles.statCardPrimary}`}>
              <div className={styles.statLabel}>Total Bookings</div>
              <div className={styles.statValue}>{analytics.total}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Pending</div>
              <div className={`${styles.statValue} ${styles.valuePending}`}>{analytics.pending}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Approved</div>
              <div className={`${styles.statValue} ${styles.valueApproved}`}>{analytics.approved}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Rejected</div>
              <div className={`${styles.statValue} ${styles.valueRejected}`}>{analytics.rejected}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Cancelled</div>
              <div className={`${styles.statValue} ${styles.valueCancelled}`}>{analytics.cancelled}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Most Used Resource</div>
              <div className={styles.resourceValue}>{analytics.mostUsedResource}</div>
            </div>
          </section>

          <section className={styles.tabSection}>
            <p className={styles.tabHint}>Filter by status</p>
            <div className={styles.tabBar}>
              {TABS.map((t) => (
                <button
                  key={t}
                  className={`${styles.tabBtn} ${tab === t ? styles.tabBtnActive : ""}`}
                  onClick={() => setTab(t)}
                >
                  <span>{t}</span>
                  <strong className={styles.tabCount}>{tabCount(t)}</strong>
                </button>
              ))}
            </div>
          </section>

          {error && <div className={styles.errorBox}>{error}</div>}
          {loading && <div className={styles.loader}>Loading bookings...</div>}

          {!loading && data.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>0</div>
              <p>No bookings with status <strong>{tab}</strong>.</p>
            </div>
          )}

          {!loading && data.length > 0 && (
            <div className={styles.listWrap}>
              {data.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  isAdmin={true}
                  currentUserId={user?.userId?.toString() ?? ""}
                  onRefresh={() => fetchBookings(tab)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ToastContainer>
  );
}