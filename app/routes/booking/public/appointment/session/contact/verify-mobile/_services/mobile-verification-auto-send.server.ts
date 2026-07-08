import { createCookie } from 'react-router';
import { ContactAuthService } from '../../_services/contact-auth.service.server';
import { VerificationTokenService } from '../../_services/verification-token.service.server';

const MOBILE_CODE_SENT_COOKIE_MAX_AGE_SECONDS = 5 * 60;

const mobileVerificationCodeSentCookie = createCookie('booking_mobile_code_sent', {
  httpOnly: true,
  maxAge: MOBILE_CODE_SENT_COOKIE_MAX_AGE_SECONDS,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
});

type AutoSendResult = {
  verificationSessionToken: string;
  headers: Headers;
};

export class MobileVerificationAutoSendService {
  static async ensureSentOnce(request: Request, verificationSessionToken: string): Promise<AutoSendResult> {
    const headers = new Headers();
    const sentToken = await this.readSentToken(request);

    if (sentToken === verificationSessionToken) {
      return {
        verificationSessionToken,
        headers,
      };
    }

    let nextToken = verificationSessionToken;
    let nextTokenExpiresAt: string | null = null;

    try {
      const response = await ContactAuthService.resendVerification({
        verificationSessionToken,
        sendEmail: false,
        sendMobile: true,
      });

      nextToken = response.nextToken ?? verificationSessionToken;
      nextTokenExpiresAt = response.nextTokenExpiresAt;

      if (nextToken !== verificationSessionToken) {
        headers.append('Set-Cookie', await VerificationTokenService.buildVerificationCookieHeader(nextToken, nextTokenExpiresAt));
      }
    } catch {
      // The backend owns SMS throttling. Mark this token as attempted so refreshes do not hammer the endpoint.
    }

    headers.append('Set-Cookie', await this.buildSentCookie(nextToken));

    return {
      verificationSessionToken: nextToken,
      headers,
    };
  }

  private static async readSentToken(request: Request): Promise<string | null> {
    const value = await mobileVerificationCodeSentCookie.parse(request.headers.get('Cookie'));
    return typeof value === 'string' && value ? value : null;
  }

  private static async buildSentCookie(token: string): Promise<string> {
    return mobileVerificationCodeSentCookie.serialize(token);
  }
}
