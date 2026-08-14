import { apiClient } from "@/lib/api-client";
import type { AuthenticatedUser } from "@/types/auth";

interface UserResponse {
  user: AuthenticatedUser;
}

export function login(email: string, password: string) {
  return apiClient.post<UserResponse>("/api/auth/login", { email, password });
}

export function getMe() {
  return apiClient.get<UserResponse>("/api/auth/me");
}

export function logout() {
  return apiClient.post<void>("/api/auth/logout");
}
