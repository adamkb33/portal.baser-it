/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseInvitedUserTokenDto } from '../models/ApiResponseInvitedUserTokenDto';
import type { CreateUserRequestDto } from '../models/CreateUserRequestDto';
import type { CancelablePromise } from '../../common/core/CancelablePromise';
import { OpenAPI } from '../OpenAPI';
import { request as __request } from '../../common/core/request';
export class SystemAdminUserControllerService {
    /**
     * @returns ApiResponseInvitedUserTokenDto OK
     * @throws ApiError
     */
    public static inviteUser({
        requestBody,
    }: {
        requestBody: CreateUserRequestDto,
    }): CancelablePromise<ApiResponseInvitedUserTokenDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/system-admin/users',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
