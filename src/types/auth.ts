export type UserRole = "ORGANIZER" | "CUSTOMER" | "GATE";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}
