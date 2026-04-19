"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { createBooking } from '@/services/bookingApi';
import DateTimePicker from '@/components/DateTimePicker';
import ToastContainer, { useToast } from '@/components/ToastContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import styles from './booking.module.css';

interface BookingForm {
  userId: string;
  email: string;
  resourceName: string;
  startTime: string;
  endTime: string;
  attendeeCount: string;
  purpose: string;
}

interface ValidationErrors {
  userId?: string;
  email?: string;
  resourceName?: string;
  startTime?: string;
  endTime?: string;
  attendeeCount?: string;
}

type ResourceCategory = 'labs' | 'lecture-halls' | 'library-rooms' | 'auditoriums' | 'meeting-rooms';

interface ResourceOption {
  id: string;
  name: string;
  capacity: number;
  category: ResourceCategory;
}

const RESOURCE_CATEGORIES: Array<{ value: ResourceCategory; label: string }> = [
  { value: 'labs', label: 'Labs' },
  { value: 'lecture-halls', label: 'Lecture Halls' },
  { value: 'library-rooms', label: 'Library Rooms' },
  { value: 'auditoriums', label: 'Auditoriums' },
  { value: 'meeting-rooms', label: 'Meeting Rooms' },
];

const RESOURCES: ResourceOption[] = [
  { id: 'lab-a', name: 'Lab A', capacity: 20, category: 'labs' },
  { id: 'lab-b', name: 'Lab B', capacity: 20, category: 'labs' },
  { id: 'lab-c', name: 'Lab C', capacity: 24, category: 'labs' },
  { id: 'lecture-hall-1', name: 'Lecture Hall 1', capacity: 80, category: 'lecture-halls' },
  { id: 'lecture-hall-2', name: 'Lecture Hall 2', capacity: 120, category: 'lecture-halls' },
  { id: 'library-room-1', name: 'Library Room 1', capacity: 12, category: 'library-rooms' },
  { id: 'library-room-2', name: 'Library Room 2', capacity: 16, category: 'library-rooms' },
  { id: 'auditorium', name: 'Auditorium', capacity: 100, category: 'auditoriums' },
  { id: 'meeting-room-1', name: 'Meeting Room 1', capacity: 8, category: 'meeting-rooms' },
  { id: 'meeting-room-2', name: 'Meeting Room 2', capacity: 10, category: 'meeting-rooms' },
  { id: 'meeting-room-3', name: 'Meeting Room 3', capacity: 8, category: 'meeting-rooms' },
];

const MIN_BOOKING_DURATION = 30; // minutes
const MAX_BOOKING_DURATION = 480; // 8 hours in minutes
const GMAIL_REGEX = /^[a-z0-9._%+-]+@gmail\.com$/;

function normalizeLocalDateTime(value: string): string {
  const trimmed = value.trim();
  // DateTimePicker may return either YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss.
  // Ensure payload is always YYYY-MM-DDTHH:mm:ss.
  const hasSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed);
  if (hasSeconds) return trimmed;

  const hasMinutePrecision = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed);
  if (hasMinutePrecision) return `${trimmed}:00`;

  return trimmed;
}

function CreateBookingContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState<BookingForm>({
    userId: '', email: '', resourceName: '', startTime: '', endTime: '', attendeeCount: '', purpose: '',
  });

  // Pre-fill userId and email from JWT as soon as the user is available
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        userId: user.userId.toString(),
        email: user.email,
      }));
    }
  }, [user]);
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(v => ({ ...v, [name]: undefined }));
    }
    // Clear general error
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate userId
    if (!form.userId.trim()) {
      errors.userId = 'User ID is required';
    } else if (form.userId.trim().length < 3) {
      errors.userId = 'User ID must be at least 3 characters';
    }

    // Validate email
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!GMAIL_REGEX.test(form.email.trim())) {
      errors.email = 'Please enter a valid Gmail address (example@gmail.com)';
    }

    // Validate resourceName
    if (!form.resourceName.trim()) {
      errors.resourceName = 'Please select a resource';
    }

    // Validate attendeeCount
    if (!form.attendeeCount) {
      errors.attendeeCount = 'Attendee count is required';
    } else {
      const count = parseInt(form.attendeeCount, 10);
      if (isNaN(count) || count < 1) {
        errors.attendeeCount = 'Attendee count must be at least 1';
      } else {
        // Get selected resource capacity
        const selectedResource = RESOURCES.find(r => r.name === form.resourceName);
        if (selectedResource && count > selectedResource.capacity) {
          errors.attendeeCount = `Attendee count cannot exceed capacity of ${selectedResource.capacity}`;
        }
      }
    }

    // Validate startTime
    if (!form.startTime) {
      errors.startTime = 'Start time is required';
    }

    // Validate endTime
    if (!form.endTime) {
      errors.endTime = 'End time is required';
    }

    // Validate time relationship
    if (form.startTime && form.endTime) {
      const startDate = new Date(form.startTime);
      const endDate = new Date(form.endTime);

      if (startDate >= endDate) {
        errors.endTime = 'End time must be after start time';
      } else {
        // Calculate duration in minutes
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationMins = durationMs / (1000 * 60);

        if (durationMins < MIN_BOOKING_DURATION) {
          errors.endTime = `Booking must be at least ${MIN_BOOKING_DURATION} minutes`;
        } else if (durationMins > MAX_BOOKING_DURATION) {
          errors.endTime = `Booking cannot exceed ${MAX_BOOKING_DURATION} minutes (${MAX_BOOKING_DURATION / 60} hours)`;
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateDuration = (): string => {
    if (!form.startTime || !form.endTime) return '';
    const startDate = new Date(form.startTime);
    const endDate = new Date(form.endTime);
    const durationMs = endDate.getTime() - startDate.getTime();
    
    if (durationMs < 0) return '';
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const mins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const startTime = normalizeLocalDateTime(form.startTime);
      const endTime = normalizeLocalDateTime(form.endTime);

      const payload = {
        userId: form.userId.trim(),
        email: form.email.trim().toLowerCase(),
        userEntityId: user?.userId ?? null,   // send DB id for notification dispatch
        resourceName: form.resourceName,
        startTime: startTime,
        endTime: endTime,
        attendeeCount: parseInt(form.attendeeCount, 10),
        purpose: form.purpose.trim() || null,
      };

      // Detailed logging for debugging
      console.log('=== BOOKING REQUEST ===');
      console.log('Raw form data:', form);
      console.log('Processed payload:', payload);
      console.log('Payload JSON:', JSON.stringify(payload, null, 2));
      console.log('Field types:', {
        userId: typeof payload.userId,
        resourceName: typeof payload.resourceName,
        startTime: typeof payload.startTime,
        endTime: typeof payload.endTime,
        purpose: typeof payload.purpose,
      });
      console.log('=======================');

      let res;
      try {
        res = await createBooking(payload);
      } catch (firstError) {
        if (axios.isAxiosError(firstError)) {
          const responseData = firstError.response?.data;
          const responseMessage =
            typeof responseData === 'string'
              ? responseData
              : (typeof responseData?.message === 'string' ? responseData.message : '');

          if (responseMessage.includes('Unrecognized field "email"')) {
            const fallbackPayload = { ...payload };
            delete (fallbackPayload as { email?: string }).email;
            res = await createBooking(fallbackPayload);
            showToast('Booking created, but backend email support is not active yet.', 'warning', 5000);
          } else {
            throw firstError;
          }
        } else {
          throw firstError;
        }
      }

      console.log('✅ Booking created:', res.data);

      setBookingId(res.data.id);
      setShowSuccessModal(true);
      setSuccess(`Booking #${res.data.id} submitted successfully!`);
      showToast(`Booking #${res.data.id} submitted successfully!`, 'success', 4000);

      // Reset form — keep userId and email from JWT
      setForm({
        userId: user?.userId.toString() ?? '',
        email: user?.email ?? '',
        resourceName: '',
        startTime: '',
        endTime: '',
        attendeeCount: '',
        purpose: '',
      });

      // Navigate after 3 seconds
      setTimeout(() => {
        router.push(`/my-bookings`);
      }, 3000);
    } catch (e) {
      let msg = 'Failed to create booking. Please try again.';
      let details = '';

      const isRecord = (value: unknown): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null;

      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const responseData: unknown = e.response?.data;

        // Keep diagnostics in dev, but avoid noisy console errors in runtime overlay.
        if (process.env.NODE_ENV === 'development') {
          console.debug('API Error Details:', {
            status,
            statusText: e.response?.statusText,
            data: responseData ?? null,
            headers: e.response?.headers,
            requestUrl: e.config?.url,
            method: e.config?.method,
            code: e.code,
            message: e.message,
            hasResponse: Boolean(e.response),
            hasRequest: Boolean(e.request),
          });
        }

        // Priority order for error extraction
        if (isRecord(responseData) && typeof responseData.message === 'string') {
          msg = responseData.message;
        } else if (isRecord(responseData) && typeof responseData.error === 'string') {
          msg = responseData.error;
        } else if (isRecord(responseData) && isRecord(responseData.fieldErrors)) {
          // Handle field-level validation errors
          msg = 'Validation failed:';
          details = Object.entries(responseData.fieldErrors)
            .map(([field, errors]) => `${field}: ${errors}`)
            .join('; ');
        } else if (status === 400 || status === 422) {
          msg = 'Validation error from server';
          // Try to extract meaningful error details
          if (typeof responseData === 'string') {
            details = responseData;
          } else if (responseData) {
            details = JSON.stringify(responseData, null, 2);
          }
        } else if (status === 409) {
          msg = 'Booking conflict: Resource is already booked for this time';
          if (isRecord(responseData) && typeof responseData.message === 'string') {
            details = responseData.message;
          }
        } else if (status === 500) {
          msg = 'Server error. Please try again later.';
          if (isRecord(responseData) && typeof responseData.message === 'string') {
            details = responseData.message;
          } else if (typeof responseData === 'string') {
            details = responseData;
          } else {
            details = JSON.stringify(responseData, null, 2);
          }
        } else if (e.code === 'ECONNREFUSED' || e.code === 'ERR_NETWORK') {
          msg = 'Cannot connect to backend server. Is it running on port 8081?';
        } else if (e.message === 'Network Error') {
          msg = 'Network error. Check if backend is running.';
        } else {
          // Fallback: include full response data
          msg = `API Error (${status}): ${e.response?.statusText || 'Unknown'}`;
          if (typeof responseData === 'string') {
            details = responseData;
          } else if (responseData) {
            details = JSON.stringify(responseData, null, 2);
          }
        }
      } else if (e instanceof Error) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('Non-Axios Error:', {
            name: e.name,
            message: e.message,
            stack: e.stack
          });
        }
        msg = e.message || 'An unexpected error occurred';
      }

      if (process.env.NODE_ENV === 'development') {
        console.debug('Error message to display:', msg);
        console.debug('Error details:', details);
      }

      const errorMsg = details ? `${msg}\n\n${details}` : msg;
      setError(errorMsg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>
          Create New <span className={styles.highlight}>Booking</span>
        </h1>
        <p className={styles.subtitle}>Fill in the details below to request a resource booking</p>
      </div>

      <div className={styles.mainContent}>
        {/* Success Modal */}
        {showSuccessModal && (
          <div className={styles.successModal}>
            <div className={styles.modalContent}>
              <div className={styles.successIcon}>✓</div>
              <h2>Booking Submitted Successfully!</h2>
              <p>Booking ID: <strong>#{bookingId}</strong></p>
              <p className={styles.statusText}>Status: <span className={styles.pendingBadge}>PENDING</span></p>
              <p className={styles.description}>Your booking request is awaiting admin approval.</p>
              <p className={styles.redirectText}>Redirecting to your bookings...</p>
            </div>
          </div>
        )}

        {/* Alert Messages */}
        {error && (
          <div className={styles.alertError}>
            <span className={styles.alertIcon}>⚠️</span>
            <div className={styles.alertContent}>
              <strong>Error</strong>
              <p>{error}</p>
            </div>
            <button
              className={styles.alertClose}
              onClick={() => setError('')}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {success && !showSuccessModal && (
          <div className={styles.alertSuccess}>
            <span className={styles.alertIcon}>✓</span>
            <div className={styles.alertContent}>
              <strong>Success</strong>
              <p>{success}</p>
            </div>
          </div>
        )}

        <div className={styles.layoutGrid}>
          <aside className={styles.sidePanel}>
            <h2 className={styles.sideTitle}>Plan Smarter</h2>
            <p className={styles.sideText}>
              Use this form to request a resource quickly, avoid conflicts, and get faster approval.
            </p>

            <div className={styles.pillList}>
              <span className={styles.pill}>Fast Request</span>
              <span className={styles.pill}>Capacity Checked</span>
              <span className={styles.pill}>Conflict Detection</span>
            </div>

            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepText}>Enter requester and contact details</span>
            </div>
            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepText}>Select resource, attendees, and time</span>
            </div>
            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepText}>Submit and wait for admin approval</span>
            </div>
          </aside>

          {/* Main Form Card */}
          <div className={styles.formCard}>
            <form onSubmit={handleSubmit} noValidate>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionKicker}>Step 1</span>
                <h3 className={styles.sectionTitle}>Requester Details</h3>
              </div>
            {/* User ID Field — pre-filled from JWT, read-only */}
            <div className={styles.formGroup}>
              <label htmlFor="userId" className={styles.label}>
                User ID
              </label>
              <input
                id="userId"
                type="text"
                name="userId"
                value={form.userId}
                readOnly
                className={`${styles.input}`}
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            {/* Email Field — pre-filled from JWT, read-only */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                readOnly
                className={`${styles.input}`}
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            <div className={styles.sectionHeader}>
              <span className={styles.sectionKicker}>Step 2</span>
              <h3 className={styles.sectionTitle}>Booking Details</h3>
            </div>

            {/* Resource Selection */}
            <div className={styles.formGroup}>
              <label htmlFor="resourceName" className={styles.label}>
                Select Resource <span className={styles.required}>*</span>
              </label>
              <select
                id="resourceName"
                name="resourceName"
                value={form.resourceName}
                onChange={onChange}
                className={`${styles.select} ${validationErrors.resourceName ? styles.inputError : ''}`}
                aria-invalid={!!validationErrors.resourceName}
                aria-describedby={validationErrors.resourceName ? 'resource-error' : undefined}
              >
                <option value="">— Select a resource —</option>
                {RESOURCE_CATEGORIES.map((category) => {
                  const categoryResources = RESOURCES.filter((resource) => resource.category === category.value);
                  return (
                    <optgroup key={category.value} label={category.label}>
                      {categoryResources.map((resource) => (
                        <option key={resource.id} value={resource.name}>
                          {resource.name} (Capacity: {resource.capacity})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              {validationErrors.resourceName && (
                <span id="resource-error" className={styles.errorMessage}>
                  {validationErrors.resourceName}
                </span>
              )}
            </div>

            {/* Attendee Count Field */}
            <div className={styles.formGroup}>
              <label htmlFor="attendeeCount" className={styles.label}>
                Number of Attendees <span className={styles.required}>*</span>
              </label>
              <input
                id="attendeeCount"
                type="number"
                name="attendeeCount"
                value={form.attendeeCount}
                onChange={onChange}
                placeholder="e.g., 5"
                min="1"
                className={`${styles.input} ${validationErrors.attendeeCount ? styles.inputError : ''}`}
                aria-invalid={!!validationErrors.attendeeCount}
                aria-describedby={validationErrors.attendeeCount ? 'attendee-error' : undefined}
              />
              {validationErrors.attendeeCount && (
                <span id="attendee-error" className={styles.errorMessage}>
                  {validationErrors.attendeeCount}
                </span>
              )}
            </div>

            {/* Date/Time Selection */}
            <div className={styles.dateTimeSection}>
              <div className={styles.formRow}>
                <div className={styles.dateField}>
                  <DateTimePicker
                    label="Start Time"
                    value={form.startTime}
                    onChange={(value) => {
                      setForm(f => ({ ...f, startTime: value }));
                      setValidationErrors(v => ({ ...v, startTime: undefined }));
                    }}
                  />
                  {validationErrors.startTime && (
                    <span className={styles.errorMessage}>{validationErrors.startTime}</span>
                  )}
                </div>

                <div className={styles.dateField}>
                  <DateTimePicker
                    label="End Time"
                    value={form.endTime}
                    onChange={(value) => {
                      setForm(f => ({ ...f, endTime: value }));
                      setValidationErrors(v => ({ ...v, endTime: undefined }));
                    }}
                  />
                  {validationErrors.endTime && (
                    <span className={styles.errorMessage}>{validationErrors.endTime}</span>
                  )}
                </div>
              </div>

              {/* Duration Display */}
              {form.startTime && form.endTime && (
                <div className={styles.durationInfo}>
                  <span className={styles.durationLabel}>Duration:</span>
                  <span className={styles.durationValue}>{calculateDuration()}</span>
                </div>
              )}
            </div>

            {/* Purpose Field */}
            <div className={styles.sectionHeader}>
              <span className={styles.sectionKicker}>Step 3</span>
              <h3 className={styles.sectionTitle}>Purpose & Submission</h3>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="purpose" className={styles.label}>
                Purpose
              </label>
              <textarea
                id="purpose"
                name="purpose"
                value={form.purpose}
                onChange={onChange}
                placeholder="What is this booking for?"
                className={styles.textarea}
                rows={4}
              />
              <p className={styles.helpText}>
                Provide any relevant details about your booking request to help admins make informed decisions.
              </p>
            </div>

            {/* Submit Button */}
            <div className={styles.buttonContainer}>
              <button
                type="submit"
                className={`${styles.submitButton} ${loading ? styles.loading : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Booking Request'
                )}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateBooking() {
  return (
    <ProtectedRoute>
      <ToastContainer>
        <CreateBookingContent />
      </ToastContainer>
    </ProtectedRoute>
  );
}