import { OpenAPI } from '~/api/clients/base/OpenAPI';
import { ENV } from '~/api/config/env';
import { type SignInFormSchema } from '../_schemas/sign-in.form.schema';
import type { ApiClientError } from '~/api/clients/http';
import { accessTokenCookie, refreshTokenCookie } from '../../_features/auth.cookies.server';
import { redirect, type ActionFunctionArgs } from 'react-router';
import { baseApi } from '~/lib/utils';
import { toAuthTokens } from '../../_utils/token.utils';

export async function AuthSignInAction({ request }: ActionFunctionArgs) {
  OpenAPI.BASE = ENV.BASE_SERVICE_BASE_URL;

  const formData = await request.formData();
  const payload = Object.fromEntries(formData) as unknown as SignInFormSchema;

  try {
    const response = await baseApi().AuthControllerService.AuthControllerService.signIn({
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
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}
