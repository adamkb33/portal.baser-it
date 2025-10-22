import { AuthControllerService } from '~/api/clients/identity';
import { OpenAPI } from '~/api/clients/identity/OpenAPI';
import { ENV } from '~/api/config/env';
import { type SignInSchema } from '../schemas/sign-in.schema';
import { toAuthTokens } from '../token/token-utils';
import type { ApiClientError } from '~/api/clients/http';
import { accessTokenCookie, refreshTokenCookie } from './cookies.server';
import { redirect, type ActionFunctionArgs } from 'react-router';

export async function signIn({ request }: ActionFunctionArgs) {
  OpenAPI.BASE = ENV.IDENTITY_BASE_URL;

  const formData = await request.formData();
  const payload = Object.fromEntries(formData) as unknown as SignInSchema;

  try {
    const response = await AuthControllerService.signIn({
      requestBody: {
        email: payload.email,
        password: payload.password,
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
