export type AppRole = "PLATFORM_ADMIN" | "INSITUTION_ADMIN" | "STAFF";

export interface AuthenticatedUser {
  token: string;
  role: AppRole;
  subject: string;
}
