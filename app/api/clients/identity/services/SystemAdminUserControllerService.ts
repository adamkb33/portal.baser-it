/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseInvitedUserTokenDto } from '../models/ApiResponseInvitedUserTokenDto';
import type { CreateUserRequestDto } from '../models/CreateUserRequestDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class SystemAdminUserControllerService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns ApiResponseInvitedUserTokenDto OK
     * @throws ApiError
     */
    public inviteUser({
        requestBody,
    }: {
        requestBody: CreateUserRequestDto,
    }): CancelablePromise<ApiResponseInvitedUserTokenDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/system-admin/users',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
