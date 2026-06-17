export type AppRole = "PLATFORM_ADMIN" | "INSITUTION_ADMIN" | "STAFF" | "STUDENT";

export interface AuthenticatedUser {
  token: string;
  role: AppRole;
  subject: string;
}
