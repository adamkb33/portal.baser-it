import type { AuthenticatedUserPayload } from 'tmp/openapi/gen/base';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { ENV } from '~/api/config/env';
import { UserRole, type Roles, type CompanyProducts, type AuthenticationTokenDto } from '~/api/clients/types';
import { redirect } from 'react-router';

export type UserSession = {
  user: AuthenticatedUserPayload;
  accessToken: string;
};

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly reason: 'missing' | 'expired' | 'invalid',
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

interface JwtClaimsPayload extends JwtPayload {
  email?: string;
  roles?: string[];
  company?: {
    companyId?: number;
    companyOrgNum?: string;
    companyRoles?: string[];
    companyProducts?: string[];
  };
}

export class AuthService {
  private readonly jwtSecret: string;

  constructor(jwtSecret: string = ENV.JWT_SECRET) {
    this.jwtSecret = jwtSecret;
  }

  verifyAndDecodeToken(token: string): AuthenticatedUserPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtClaimsPayload;
      return this.mapToAuthPayload(decoded);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expired', 'expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token', 'invalid');
      }
      throw error;
    }
  }

  isTokenExpired(token: string, bufferSeconds: number = 300): boolean {
    try {
      const decoded = jwt.decode(token) as JwtClaimsPayload;
      if (!decoded?.exp) {
        return true;
      }

      const expiresAt = decoded.exp * 1000;
      const now = Date.now();
      const bufferMs = bufferSeconds * 1000;

      return expiresAt <= now + bufferMs;
    } catch {
      return true;
    }
  }

  private mapToAuthPayload(claims: JwtClaimsPayload): AuthenticatedUserPayload {
    const id = this.parseIdentifier(claims.sub);
    const email = typeof claims.email === 'string' ? claims.email : '';
    const roles = this.normalizeRoles(claims.roles);

    return {
      id,
      email,
      roles,
      company: claims.company
        ? {
            companyId: claims.company.companyId ?? 0,
            companyOrgNum: claims.company.companyOrgNum ?? '',
            companyRoles: this.normalizeCompanyRoles(claims.company.companyRoles),
            companyProducts: this.normalizeCompanyProducts(claims.company.companyProducts),
          }
        : undefined,
    };
  }

  private parseIdentifier(sub?: string): number {
    const parsed = Number(sub ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private normalizeRoles(roles?: string[]): UserRole[] {
    if (!Array.isArray(roles)) {
      return [];
    }
    return roles.filter((role): role is UserRole => typeof role === 'string') as UserRole[];
  }

  private normalizeCompanyRoles(roles?: string[]): Roles[] {
    if (!Array.isArray(roles)) {
      return [];
    }
    return roles.filter((role): role is Roles => typeof role === 'string') as Roles[];
  }

  private normalizeCompanyProducts(products?: string[]): CompanyProducts[] {
    if (!Array.isArray(products)) {
      return [];
    }
    return products.filter((product): product is CompanyProducts => typeof product === 'string') as CompanyProducts[];
  }

  async getUserSession(request: Request): Promise<UserSession> {
    const cookieHeader = request.headers.get('Cookie');
    const accessToken = await accessTokenCookie.parse(cookieHeader);

    if (!accessToken) {
      throw new AuthenticationError('No access token', 'missing');
    }

    const user = this.verifyAndDecodeToken(accessToken);

    return { user, accessToken };
  }

  async requireAuth(request: Request, redirectTo: string = '/'): Promise<void> {
    try {
      await this.getUserSession(request);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw redirect(redirectTo);
      }
      throw error;
    }
  }

  async getTokensFromRequest(request: Request) {
    const cookieHeader = request.headers.get('Cookie');
    return {
      accessToken: await accessTokenCookie.parse(cookieHeader),
      refreshToken: await refreshTokenCookie.parse(cookieHeader),
    };
  }

  async processTokenRefresh(tokenDto: AuthenticationTokenDto): Promise<{
    user: AuthenticatedUserPayload;
    headers: Headers;
  }> {
    const user = this.verifyAndDecodeToken(tokenDto.accessToken);
    const headers = await this.setAuthCookies(
      tokenDto.accessToken,
      tokenDto.refreshToken,
      tokenDto.accessTokenExpiresAt,
      tokenDto.refreshTokenExpiresAt,
    );

    return { user, headers };
  }

  async setAuthCookies(
    accessToken: string,
    refreshToken: string,
    accessExpiresAt: number,
    refreshExpiresAt: number,
  ): Promise<Headers> {
    const accessCookie = await accessTokenCookie.serialize(accessToken, {
      expires: new Date(accessExpiresAt * 1000),
    });
    const refreshCookie = await refreshTokenCookie.serialize(refreshToken, {
      expires: new Date(refreshExpiresAt * 1000),
    });

    const headers = new Headers();
    headers.append('Set-Cookie', accessCookie);
    headers.append('Set-Cookie', refreshCookie);

    return headers;
  }

  async clearAuthCookies(): Promise<Headers> {
    const accessCookie = await accessTokenCookie.serialize('', { expires: new Date(0) });
    const refreshCookie = await refreshTokenCookie.serialize('', { expires: new Date(0) });

    const headers = new Headers();
    headers.append('Set-Cookie', accessCookie);
    headers.append('Set-Cookie', refreshCookie);

    return headers;
  }

  getCompanyIdFromToken(accessToken: string): number | undefined {
    if (!accessToken || this.isTokenExpired(accessToken)) {
      return undefined;
    }

    try {
      const payload = this.verifyAndDecodeToken(accessToken);
      return payload.company?.companyId;
    } catch {
      return undefined;
    }
  }

  isCompanyUser(user: AuthenticatedUserPayload): boolean {
    return user?.roles.includes(UserRole.COMPANY_USER) ?? false;
  }

  needsCompanyContext(user: AuthenticatedUserPayload): boolean {
    return this.isCompanyUser(user) && !user?.company;
  }
}

export const authService = new AuthService();
