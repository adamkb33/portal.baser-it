import { OpenAPI } from '~/api/clients/base/OpenAPI';
import { ENV } from '~/api/config/env';
import type { ApiClientError } from '~/api/clients/http';
import { redirect, type ActionFunctionArgs } from 'react-router';
import { baseApi } from '~/lib/utils';
import type { AcceptInviteSchema } from '../schemas/accept-invite-form.schema';
import { toAuthTokens } from '../../utils/token.utils';
import { accessTokenCookie, refreshTokenCookie } from '../../features/auth.cookies.server';

export async function authAcceptInviteAction({ request }: ActionFunctionArgs) {
  OpenAPI.BASE = ENV.BASE_SERVICE_BASE_URL;

  const formData = await request.formData();
  const payload = Object.fromEntries(formData) as unknown as AcceptInviteSchema;

  try {
    const response = await baseApi().AuthControllerService.AuthControllerService.acceptInvite({
      inviteToken: payload.inviteToken,
      requestBody: {
        givenName: payload.givenName,
        familyName: payload.familyName,
        password: payload.password,
        password2: payload.confirmPassword,
      },
    });

    if (!response.success || !response.data) {
      throw new Error();
    }

    const tokens = toAuthTokens(response.data);

    const accessCookie = await accessTokenCookie.serialize(tokens.accessToken, {
      expires: new Date(tokens.accessTokenExpiresAt * 1000),
    });
    const refreshCookie = await refreshTokenCookie.serialize(tokens.refreshToken, {
      expires: new Date(tokens.refreshTokenExpiresAt * 1000),
    });

    return redirect('/', {
      headers: [
        ['Set-Cookie', accessCookie],
        ['Set-Cookie', refreshCookie],
      ],
    });
  } catch (error: any) {
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}
