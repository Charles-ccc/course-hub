import { SetMetadata } from "@nestjs/common";
import type { AppRole } from "./auth.types";

export const ROLE_METADATA_KEY = "requiredRole";

export const RequireRole = (role: AppRole) =>
  SetMetadata(ROLE_METADATA_KEY, role);
