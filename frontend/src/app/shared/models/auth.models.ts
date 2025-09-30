export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  message: string;
}

export interface User {
  email: string;
  displayName?: string;
}