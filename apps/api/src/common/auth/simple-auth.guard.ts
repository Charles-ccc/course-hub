import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLE_METADATA_KEY } from "./roles.decorator";
import type { AppRole, AuthenticatedUser } from "./auth.types";
import { TokenService } from "./token.service";

type RequestWithUser = Request & {
  headers: Record<string, string | undefined>;
  user?: AuthenticatedUser;
};

@Injectable()
export class SimpleAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.get<AppRole | undefined>(
      ROLE_METADATA_KEY,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authorization.slice("Bearer ".length).trim();
    const user = await this.tokenService.verifyAccessToken(token);

    if (requiredRole && user.role !== requiredRole) {
      throw new ForbiddenException("Insufficient role");
    }

    request.user = user;
    return true;
  }
}
