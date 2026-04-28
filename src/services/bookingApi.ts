import axiosInstance from './axiosInstance';

const BASE = '/api/bookings';

export const createBooking     = (data: unknown)                             => axiosInstance.post(`${BASE}/`, data);
export const getAllBookings     = (status: string | null)                     => axiosInstance.get(`${BASE}/`, { params: status ? { status } : {} });
export const getBookingById    = (id: number)                                => axiosInstance.get(`${BASE}/${id}`);
export const getBookingsByUser = (userId: string)                            => axiosInstance.get(`${BASE}/user/${userId}`);
export const approveOrReject   = (id: number, data: unknown)                 => axiosInstance.patch(`${BASE}/${id}/status`, data);
export const cancelBooking     = (id: number, userId: string)                => axiosInstance.patch(`${BASE}/${id}/cancel`, null, { params: { userId } });
export const updateBooking     = (id: number, data: unknown, userId: string) => axiosInstance.put(`${BASE}/${id}`, data, { params: { userId } });
