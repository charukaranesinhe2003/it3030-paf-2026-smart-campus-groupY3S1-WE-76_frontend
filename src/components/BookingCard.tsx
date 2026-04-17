"use client";

import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import EditBookingModal from './EditBookingModal';
import { approveOrReject, cancelBooking } from '../services/bookingApi';
import { useToast } from './ToastContainer';
import axios from 'axios';
import styles from './BookingCard.module.css';

interface Booking {
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
}

interface BookingCardProps {
  booking: Booking;
  isAdmin: boolean;
  currentUserId: string;
  onRefresh: () => void;
}

function fmt(dt: string | undefined): string {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function BookingCard({ booking, isAdmin, currentUserId, onRefresh }: BookingCardProps) {
  const [note, setNote]              = useState('');
  const [loading, setLoading]        = useState(false);
  const [error, setError]            = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { showToast } = useToast();

  const getActionSuccessMessage = (action: string) => {
    if (action === 'APPROVE') return `Booking #${booking.id} approved successfully`;
    if (action === 'REJECT') return `Booking #${booking.id} rejected successfully`;
    return `Booking #${booking.id} updated successfully`;
  };

  const handleAction = async (action: string) => {
    setLoading(true); 
    setError('');
    try {
      await approveOrReject(booking.id, { action, adminNote: note });
      showToast(getActionSuccessMessage(action), 'success');
      setNote('');
      onRefresh();
    } catch (e) {
      const errorMsg = axios.isAxiosError(e)
        ? e.response?.data?.message || e.response?.data?.error
        : 'Action failed';
      setError(errorMsg || 'Action failed');
      showToast(errorMsg || 'Action failed', 'error');
    } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    setLoading(true); 
    setError('');
    try {
      await cancelBooking(booking.id, currentUserId);
      showToast(`Booking #${booking.id} cancelled successfully`, 'success');
      onRefresh();
    } catch (e) {
      const errorMsg = axios.isAxiosError(e)
        ? e.response?.data?.message || e.response?.data?.error
        : 'Cancel failed';
      setError(errorMsg || 'Cancel failed');
      showToast(errorMsg || 'Cancel failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.bookingCard}>
      {/* Header */}
      <div className={styles.bookingHeader}>
        <div className={styles.bookingInfo}>
          <div className={styles.bookingId}>Booking #{booking.id}</div>
          <h3 className={styles.bookingTitle}>{booking.resourceName}</h3>
        </div>
        <div className={getStatusBadgeClass(booking.status)}>
          {getStatusLabel(booking.status)}
        </div>
      </div>

      {/* Meta Information */}
      <div className={styles.bookingMeta}>
        <div className={styles.metaItem}>
          <div className={styles.metaLabel}>📅 Date & Time</div>
          <div className={styles.metaValue}>{fmt(booking.startTime)} - {fmt(booking.endTime)}</div>
        </div>
        <div className={styles.metaItem}>
          <div className={styles.metaLabel}>👥 Attendees</div>
          <div className={styles.metaValue}>{booking.attendeeCount} {booking.attendeeCount === 1 ? 'person' : 'people'}</div>
        </div>
        <div className={styles.metaItem}>
          <div className={styles.metaLabel}>👤 User ID</div>
          <div className={styles.metaValue}>{booking.userId}</div>
        </div>
        <div className={styles.metaItem}>
          <div className={styles.metaLabel}>⏰ Created</div>
          <div className={styles.metaValue}>{fmt(booking.createdAt)}</div>
        </div>
      </div>

      {/* Purpose */}
      {booking.purpose && (
        <div className={styles.bookingPurpose}>
          <span className={styles.bookingPurposeLabel}>Purpose</span>
          {booking.purpose}
        </div>
      )}

      {/* Admin Note */}
      {booking.adminNote && (
        <div className={styles.adminNote}>
          <span className={styles.adminNoteLabel}>Admin Note</span>
          {booking.adminNote}
        </div>
      )}

      {/* Error Message */}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Admin Actions */}
      {isAdmin && booking.status === 'PENDING' && (
        <>
          <textarea
            className={styles.noteInput}
            placeholder="Add an optional admin note..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <div className={styles.bookingActions}>
            <button 
              className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
              onClick={() => handleAction('APPROVE')} 
              disabled={loading}
            >
              ✅ Approve
            </button>
            <button 
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              onClick={() => handleAction('REJECT')} 
              disabled={loading}
            >
              ❌ Reject
            </button>
          </div>
        </>
      )}

      {/* Student Actions */}
      {!isAdmin && currentUserId === booking.userId &&
        (booking.status === 'PENDING' || booking.status === 'APPROVED') && (
        <div className={styles.bookingActions}>
          {booking.status === 'PENDING' && (
            <button 
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={() => setIsEditModalOpen(true)} 
              disabled={loading}
            >
              ✏️ Edit Booking
            </button>
          )}
          <button 
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={handleCancel} 
            disabled={loading}
          >
            🚫 Cancel Booking
          </button>
        </div>
      )}

      <EditBookingModal
        booking={booking}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}

function getStatusBadgeClass(status: string): string {
  const baseClass = styles.statusBadge;
  switch (status) {
    case 'PENDING':
      return `${baseClass} ${styles.statusPending}`;
    case 'APPROVED':
      return `${baseClass} ${styles.statusApproved}`;
    case 'REJECTED':
      return `${baseClass} ${styles.statusRejected}`;
    case 'CANCELLED':
      return `${baseClass} ${styles.statusCancelled}`;
    default:
      return baseClass;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return '⏳ Pending';
    case 'APPROVED':
      return '✅ Approved';
    case 'REJECTED':
      return '❌ Rejected';
    case 'CANCELLED':
      return '🚫 Cancelled';
    default:
      return status;
  }
}