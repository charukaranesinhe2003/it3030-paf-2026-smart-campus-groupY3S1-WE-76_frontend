import axiosInstance from "./axiosInstance";

export interface UserDTO {
  id: number;
  email: string;
  name: string;
  profilePictureUrl: string;
  roles: string[];
}

export interface UpdateUserPayload {
  name?: string;
  profilePictureUrl?: string;
  role?: string; // admin-only — e.g. "ROLE_TECHNICIAN"
}

/** Admin only — get all users */
export async function getAllUsers(): Promise<UserDTO[]> {
  const res = await axiosInstance.get<UserDTO[]>("/api/users");
  return res.data;
}

/** Get a single user by ID */
export async function getUserById(id: number): Promise<UserDTO> {
  const res = await axiosInstance.get<UserDTO>(`/api/users/${id}`);
  return res.data;
}

/** Update a user's profile (or role if admin) */
export async function updateUser(
  id: number,
  payload: UpdateUserPayload
): Promise<UserDTO> {
  const res = await axiosInstance.put<UserDTO>(`/api/users/${id}`, payload);
  return res.data;
}
