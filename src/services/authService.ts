import axiosInstance from "./axiosInstance";

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  name: string;
  profilePictureUrl: string;
  roles: string[];
}

/**
 * Sends the Google credential token to the backend for verification.
 * Returns the system JWT and user info on success.
 *
 * @param credential — the Google ID token from the Google Identity SDK
 */
export async function loginWithGoogle(credential: string): Promise<AuthResponse> {
  const response = await axiosInstance.post<AuthResponse>("/api/auth/google", {
    credential,
  });
  return response.data;
}
