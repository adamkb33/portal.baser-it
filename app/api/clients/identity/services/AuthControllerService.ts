/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AcceptInviteDto } from '../models/AcceptInviteDto';
import type { ApiResponseAuthenticationTokenDto } from '../models/ApiResponseAuthenticationTokenDto';
import type { ApiResponseUnit } from '../../common/models/ApiResponseUnit';
import type { AuthenticationRequestDto } from '../models/AuthenticationRequestDto';
import type { RefreshTokenRequestDto } from '../models/RefreshTokenRequestDto';
import type { SignOutRequestDto } from '../models/SignOutRequestDto';
import type { CancelablePromise } from '../../common/core/CancelablePromise';
import { OpenAPI } from '../OpenAPI';
import { request as __request } from '../../common/core/request';
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
}
