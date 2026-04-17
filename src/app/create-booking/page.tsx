import React, { useState } from 'react';
import axios from 'axios';
import { createBooking } from '@/services/bookingApi';

interface BookingForm {
  userId: string;
  resourceName: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

const RESOURCES = ['Lab A', 'Lab B', 'Seminar Room 1', 'Seminar Room 2', 'Auditorium', 'Meeting Room 3'];

export default function CreateBooking() {
  const [form, setForm] = useState<BookingForm>({
    userId: '', resourceName: '', startTime: '', endTime: '', purpose: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const payload = {
        ...form,
        startTime: new Date(form.startTime).toISOString().slice(0, 19),
        endTime:   new Date(form.endTime).toISOString().slice(0, 19),
      };
      const res = await createBooking(payload);
      setSuccess(`✅ Booking #${res.data.id} submitted! Status: PENDING — awaiting admin approval.`);
      setForm({ userId: '', resourceName: '', startTime: '', endTime: '', purpose: '' });
    } catch (e) {
      const msg = axios.isAxiosError(e) 
        ? e.response?.data?.message || e.response?.data?.error 
        : 'Failed to create booking.';
      setError(msg || 'Failed to create booking.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrap">
      <h1 className="page-title">New <span>Booking</span></h1>
      <div className="card" style={{ maxWidth: 560 }}>
        {success && <div className="alert alert-success">{success}</div>}
        {error   && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your User ID</label>
            <input name="userId" value={form.userId} onChange={onChange}
              placeholder="e.g. student_001" required />
          </div>
          <div className="form-group">
            <label>Resource</label>
            <select name="resourceName" value={form.resourceName} onChange={onChange} required>
              <option value="">— Select a resource —</option>
              {RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input type="datetime-local" name="startTime" value={form.startTime} onChange={onChange} required />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input type="datetime-local" name="endTime" value={form.endTime} onChange={onChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Purpose (optional)</label>
            <textarea name="purpose" value={form.purpose} onChange={onChange}
              placeholder="What is this booking for?" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Submitting…' : 'Submit Booking Request'}
          </button>
        </form>
      </div>
    </div>
  );
}