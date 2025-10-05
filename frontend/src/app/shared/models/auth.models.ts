export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  email: string;
  message: string;
  role: string;
}

export interface User {
  email: string;
  displayName?: string;
  role?: string;
}