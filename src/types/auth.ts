/**
 * Shape of the JWT payload after decoding.
 * Matches what JwtTokenProvider puts in the token claims.
 */
export interface JwtPayload {
  sub: string;       // user id (as string)
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

/**
 * The auth state stored in context and derived from the JWT.
 */
export interface AuthUser {
  userId: number;
  email: string;
  roles: string[];
}
