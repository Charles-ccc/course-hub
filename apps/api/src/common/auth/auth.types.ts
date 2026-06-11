export type AppRole = "PLATFORM_ADMIN" | "INSITUTION_ADMIN";

export interface AuthenticatedUser {
  token: string;
  role: AppRole;
  subject: string;
}
