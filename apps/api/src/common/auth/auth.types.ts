export type AppRole = "PLATFORM_ADMIN" | "INSTITUTION_ADMIN";

export interface AuthenticatedUser {
  token: string;
  role: AppRole;
  subject: string;
}
