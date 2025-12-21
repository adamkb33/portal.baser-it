
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListInviteTokenDto } from '@types';
import type { ApiResponsePaginatedResponseCompanyUserDto } from '@types';
import type { ApiResponseUnit } from '@types';
import type { Pageable } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class AdminCompanyUserControllerService {
    /**
     * @returns ApiResponsePaginatedResponseCompanyUserDto OK
     * @throws ApiError
     */
    public static getCompanyUsers({
        pageable,
        includeDeleted = false,
    }: {
        pageable: Pageable,
        includeDeleted?: boolean,
    }): CancelablePromise<ApiResponsePaginatedResponseCompanyUserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/company-user/users',
            query: {
                'pageable': pageable,
                'includeDeleted': includeDeleted,
            },
        });
    }
    /**
     * @returns ApiResponseListInviteTokenDto OK
     * @throws ApiError
     */
    public static getInvitations(): CancelablePromise<ApiResponseListInviteTokenDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/company-user/invitations',
        });
    }
    /**
     * @returns ApiResponseUnit OK
     * @throws ApiError
     */
    public static deleteCompanyUser({
        userId,
    }: {
        userId: number,
    }): CancelablePromise<ApiResponseUnit> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/admin/company-user/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
}
