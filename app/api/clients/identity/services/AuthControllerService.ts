/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AcceptInviteDto } from '../models/AcceptInviteDto';
import type { ApiResponseAuthenticationTokenDto } from '../models/ApiResponseAuthenticationTokenDto';
import type { ApiResponseUnit } from '../models/ApiResponseUnit';
import type { AuthenticationRequestDto } from '../models/AuthenticationRequestDto';
import type { RefreshTokenRequestDto } from '../models/RefreshTokenRequestDto';
import type { SignOutRequestDto } from '../models/SignOutRequestDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AuthControllerService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns ApiResponseUnit OK
     * @throws ApiError
     */
    public signOut({
        requestBody,
    }: {
        requestBody: SignOutRequestDto,
    }): CancelablePromise<ApiResponseUnit> {
        return this.httpRequest.request({
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
    public signIn({
        requestBody,
    }: {
        requestBody: AuthenticationRequestDto,
    }): CancelablePromise<ApiResponseAuthenticationTokenDto> {
        return this.httpRequest.request({
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
    public refresh({
        requestBody,
    }: {
        requestBody: RefreshTokenRequestDto,
    }): CancelablePromise<ApiResponseAuthenticationTokenDto> {
        return this.httpRequest.request({
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
    public acceptInvite({
        inviteToken,
        requestBody,
    }: {
        inviteToken: string,
        requestBody: AcceptInviteDto,
    }): CancelablePromise<ApiResponseAuthenticationTokenDto> {
        return this.httpRequest.request({
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
