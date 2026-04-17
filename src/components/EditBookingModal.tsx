"use client";

import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { updateBooking } from '@/services/bookingApi';
import DateTimePicker from '@/components/DateTimePicker';
import { useToast } from '@/components/ToastContainer';
import styles from './EditBookingModal.module.css';

interface EditBookingModalProps {
  booking: {
    id: number;
    userId: string;
    resourceName: string;
    startTime: string;
    endTime: string;
    attendeeCount: number;
    purpose?: string;
    status: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ValidationErrors {
  startTime?: string;
  endTime?: string;
  attendeeCount?: string;
}

const RESOURCES = [
  { id: 'lab-a', name: 'Lab A', capacity: 20 },
  { id: 'lab-b', name: 'Lab B', capacity: 20 },
  { id: 'seminar-1', name: 'Seminar Room 1', capacity: 15 },
  { id: 'seminar-2', name: 'Seminar Room 2', capacity: 15 },
  { id: 'auditorium', name: 'Auditorium', capacity: 100 },
  { id: 'meeting-3', name: 'Meeting Room 3', capacity: 8 },
];

const MIN_BOOKING_DURATION = 30; // minutes
const MAX_BOOKING_DURATION = 480; // 8 hours in minutes

export default function EditBookingModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: EditBookingModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    startTime: booking.startTime,
    endTime: booking.endTime,
    attendeeCount: booking.attendeeCount.toString(),
    purpose: booking.purpose || '',
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Find resource capacity
  const resourceCapacity = useMemo(() => {
    const resource = RESOURCES.find(r => r.name === booking.resourceName);
    return resource?.capacity || 100;
  }, [booking.resourceName]);

  const calculateDuration = () => {
    if (!form.startTime || !form.endTime) return null;
    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };

  const duration = calculateDuration();

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Start time validation
    if (!form.startTime) {
      errors.startTime = 'Start time is required';
    } else {
      const startDate = new Date(form.startTime);
      const now = new Date();
      if (startDate <= now) {
        errors.startTime = 'Start time must be in the future';
      }
    }

    // End time validation
    if (!form.endTime) {
      errors.endTime = 'End time is required';
    } else if (form.startTime && form.endTime) {
      const startDate = new Date(form.startTime);
      const endDate = new Date(form.endTime);
      if (endDate <= startDate) {
        errors.endTime = 'End time must be after start time';
      }
    }

    // Duration validation
    if (duration !== null) {
      if (duration < MIN_BOOKING_DURATION) {
        errors.startTime = `Booking must be at least ${MIN_BOOKING_DURATION} minutes`;
      }
      if (duration > MAX_BOOKING_DURATION) {
        errors.endTime = `Booking cannot exceed ${MAX_BOOKING_DURATION} minutes`;
      }
    }

    // Attendee count validation
    const attendeeCount = parseInt(form.attendeeCount, 10);
    if (!form.attendeeCount || attendeeCount < 1) {
      errors.attendeeCount = 'Attendee count must be at least 1';
    }
    if (attendeeCount > resourceCapacity) {
      errors.attendeeCount = `Attendee count cannot exceed ${resourceCapacity} for ${booking.resourceName}`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        startTime: form.startTime,
        endTime: form.endTime,
        attendeeCount: parseInt(form.attendeeCount, 10),
        purpose: form.purpose || undefined,
      };

      await updateBooking(booking.id, payload, booking.userId);

      showToast(`Booking #${booking.id} updated successfully!`, 'success', 4000);
      onSuccess();
      onClose();
    } catch (e: any) {
      let msg = 'Failed to update booking';
      let details = '';

      if (axios.isAxiosError(e) && e.response) {
        const { status, data: responseData } = e.response;

        if (status === 400 || status === 422) {
          msg = 'Validation error';
          if (typeof responseData === 'string') {
            details = responseData;
          } else if (responseData?.message) {
            details = responseData.message;
          }
        } else if (status === 409) {
          msg = 'Booking conflict: Resource is already booked for this time';
          details = responseData?.message || '';
        } else if (status === 403) {
          msg = 'You can only update your own bookings';
        } else if (status === 500) {
          msg = 'Server error. Please try again later.';
          if (responseData?.message) {
            details = responseData.message;
          }
        }
      }

      const errorMsg = details ? `${msg}: ${details}` : msg;
      setError(errorMsg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Edit Booking #{booking.id}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorAlert}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.label}>Resource</label>
            <div className={styles.readonlyField}>{booking.resourceName}</div>
            <small className={styles.hint}>Resource cannot be changed. Cancel and create a new booking to change resources.</small>
          </div>

          <div className={styles.dateFields}>
            <div className={styles.formGroup}>
              <DateTimePicker
                label="Start Time"
                value={form.startTime}
                onChange={(value) => {
                  setForm(f => ({ ...f, startTime: value }));
                  setValidationErrors(v => ({ ...v, startTime: undefined }));
                }}
              />
              {validationErrors.startTime && (
                <span className={styles.error}>{validationErrors.startTime}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <DateTimePicker
                label="End Time"
                value={form.endTime}
                onChange={(value) => {
                  setForm(f => ({ ...f, endTime: value }));
                  setValidationErrors(v => ({ ...v, endTime: undefined }));
                }}
              />
              {validationErrors.endTime && (
                <span className={styles.error}>{validationErrors.endTime}</span>
              )}
            </div>
          </div>

          {duration !== null && (
            <div className={styles.durationDisplay}>
              Duration: <strong>{duration} minutes</strong> ({(duration / 60).toFixed(1)} hours)
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Attendee Count</label>
            <input
              type="number"
              min="1"
              max={resourceCapacity}
              value={form.attendeeCount}
              onChange={(e) => {
                setForm(f => ({ ...f, attendeeCount: e.target.value }));
                setValidationErrors(v => ({ ...v, attendeeCount: undefined }));
              }}
              className={styles.input}
            />
            <small className={styles.hint}>Max capacity for {booking.resourceName}: {resourceCapacity}</small>
            {validationErrors.attendeeCount && (
              <span className={styles.error}>{validationErrors.attendeeCount}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Purpose</label>
            <textarea
              value={form.purpose}
              onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))}
              className={styles.textarea}
              placeholder="What is this booking for?"
              rows={3}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
