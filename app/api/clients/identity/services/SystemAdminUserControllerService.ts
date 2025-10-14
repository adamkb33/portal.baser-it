
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseAuthenticatedUserPayload } from '@types';
import type { ApiResponseInvitedUserTokenDto } from '@types';
import type { InviteUserDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class SystemAdminUserControllerService {
    /**
     * @returns ApiResponseInvitedUserTokenDto OK
     * @throws ApiError
     */
    public static inviteUser({
        requestBody,
    }: {
        requestBody: InviteUserDto,
    }): CancelablePromise<ApiResponseInvitedUserTokenDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/system-admin/users',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseAuthenticatedUserPayload OK
     * @throws ApiError
     */
    public static getUser({
        userId,
    }: {
        userId: number,
    }): CancelablePromise<ApiResponseAuthenticatedUserPayload> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/system-admin/users/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
}
