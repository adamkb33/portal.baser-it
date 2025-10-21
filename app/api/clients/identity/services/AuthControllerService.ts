
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AcceptInviteDto } from '@types';
import type { ApiResponseAuthenticationTokenDto } from '@types';
import type { ApiResponseListCompanySummaryDto } from '@types';
import type { ApiResponseUnit } from '@types';
import type { AuthenticationRequestDto } from '@types';
import type { RefreshTokenRequestDto } from '@types';
import type { SignOutRequestDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class AuthControllerService {
    /**
     * @returns ApiResponseUnit OK
     * @throws ApiError
     */
    public static signOut({
        requestBody,
    }: {
        requestBody: SignOutRequestDto,
    }): CancelablePromise<ApiResponseUnit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/sign-out',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseAuthenticationTokenDto OK
     * @throws ApiError
     */
    public static signIn({
        requestBody,
    }: {
        requestBody: AuthenticationRequestDto,
    }): CancelablePromise<ApiResponseAuthenticationTokenDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/sign-in',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseAuthenticationTokenDto OK
     * @throws ApiError
     */
    public static refresh({
        requestBody,
    }: {
        requestBody: RefreshTokenRequestDto,
    }): CancelablePromise<ApiResponseAuthenticationTokenDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseAuthenticationTokenDto OK
     * @throws ApiError
     */
    public static acceptInvite({
        inviteToken,
        requestBody,
    }: {
        inviteToken: string,
        requestBody: AcceptInviteDto,
    }): CancelablePromise<ApiResponseAuthenticationTokenDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/accept-invite/{inviteToken}',
            path: {
                'inviteToken': inviteToken,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListCompanySummaryDto OK
     * @throws ApiError
     */
    public static getCompanyContexts(): CancelablePromise<ApiResponseListCompanySummaryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/company-contexts',
        });
    }
}
