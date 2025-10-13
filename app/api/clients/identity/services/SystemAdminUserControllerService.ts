
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
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
}
