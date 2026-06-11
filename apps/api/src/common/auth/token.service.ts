import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomUUID, createHash } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import type { AppRole, AuthenticatedUser } from "./auth.types";

type AccessTokenPayload = {
  sub: string;
  role: AppRole;
  type: "access";
};

type RefreshTokenPayload = {
  sub: string;
  role: AppRole;
  type: "refresh";
  sessionId: string;
};

type TokenPairInput = {
  userId: string;
  role: AppRole;
  refreshOwner: { adminUserId?: string; insitutionUserId?: string };
};

type RefreshTokenRecord = {
  id: string;
  userId: string;
  role: string;
  status: "ACTIVE" | "REVOKED";
  tokenHash: string;
  expiresAt: Date;
};

@Injectable()
export class TokenService {
  private readonly accessSecret = this.readSecret(
    "JWT_ACCESS_SECRET",
    "wangke-dev-access-secret",
  );
  private readonly refreshSecret = this.readSecret(
    "JWT_REFRESH_SECRET",
    "wangke-dev-refresh-secret",
  );
  private readonly accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? "2h";
  private readonly refreshExpiresIn =
    process.env.JWT_REFRESH_EXPIRES_IN ?? "30d";

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async issueTokenPair(input: TokenPairInput): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    await this.revokeActiveTokens(input.userId, input.role);

    const sessionId = randomUUID();
    const accessToken = await this.jwtService.signAsync(
      {
        sub: input.userId,
        role: input.role,
        type: "access",
      } satisfies AccessTokenPayload,
      {
        secret: this.accessSecret,
        expiresIn: this.getAccessTokenExpiresInSeconds(),
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: input.userId,
        role: input.role,
        type: "refresh",
        sessionId,
      } satisfies RefreshTokenPayload,
      {
        secret: this.refreshSecret,
        expiresIn: this.getRefreshTokenExpiresInSeconds(),
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        id: sessionId,
        userId: input.userId,
        role: input.role,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: this.decodeExpiration(refreshToken),
        ...input.refreshOwner,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getAccessTokenExpiresInSeconds(),
    };
  }

  async refreshAccessToken(
    refreshToken: string,
    role: AppRole,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: AuthenticatedUser;
  }> {
    const payload = await this.verifyRefreshToken(refreshToken);
    if (payload.role !== role) {
      throw new UnauthorizedException("Refresh token role mismatch");
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: payload.sessionId },
    });
    this.assertStoredRefreshToken(storedToken, refreshToken, role, payload.sub);

    await this.prisma.refreshToken.update({
      where: { id: payload.sessionId },
      data: { status: "REVOKED", revokedAt: new Date() },
    });

    const refreshOwner =
      role === "PLATFORM_ADMIN"
        ? { adminUserId: payload.sub }
        : { insitutionUserId: payload.sub };

    const nextPair = await this.issueTokenPair({
      userId: payload.sub,
      role,
      refreshOwner,
    });

    return {
      ...nextPair,
      user: {
        token: nextPair.accessToken,
        role,
        subject: payload.sub,
      },
    };
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: this.accessSecret,
        },
      );
      if (payload.type !== "access") {
        throw new UnauthorizedException("Invalid access token type");
      }

      return {
        token,
        role: payload.role,
        subject: payload.sub,
      };
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.refreshSecret,
        },
      );
      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token type");
      }

      return payload;
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  private assertStoredRefreshToken(
    storedToken: RefreshTokenRecord | null,
    refreshToken: string,
    role: AppRole,
    userId: string,
  ): void {
    if (
      !storedToken ||
      storedToken.role !== role ||
      storedToken.userId !== userId
    ) {
      throw new UnauthorizedException("Refresh token not found");
    }
    if (
      storedToken.status !== "ACTIVE" ||
      storedToken.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException("Refresh token expired");
    }
    if (storedToken.tokenHash !== this.hashToken(refreshToken)) {
      throw new UnauthorizedException("Refresh token mismatch");
    }
  }

  private async revokeActiveTokens(
    userId: string,
    role: AppRole,
  ): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        role,
        status: "ACTIVE",
      },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });
  }

  private decodeExpiration(token: string): Date {
    const payload = this.jwtService.decode(token);
    if (
      !payload ||
      typeof payload !== "object" ||
      typeof payload.exp !== "number"
    ) {
      throw new UnauthorizedException("Unable to decode token expiration");
    }
    return new Date(payload.exp * 1000);
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private getAccessTokenExpiresInSeconds(): number {
    return this.parseExpiresIn(this.accessExpiresIn);
  }

  private getRefreshTokenExpiresInSeconds(): number {
    return this.parseExpiresIn(this.refreshExpiresIn);
  }

  private parseExpiresIn(rawValue: string): number {
    const value = rawValue.trim();
    if (/^\d+$/.test(value)) {
      return Number(value);
    }
    const match = value.match(/^(\d+)([smhd])$/i);
    if (!match) {
      return 7200;
    }
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multiplier =
      unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;
    return amount * multiplier;
  }

  private readSecret(key: string, fallback: string): string {
    const value = process.env[key];
    if (value) {
      return value;
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error(`${key} is required in production`);
    }

    return fallback;
  }
}
