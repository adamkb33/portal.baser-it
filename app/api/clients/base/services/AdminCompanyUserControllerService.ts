
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponsePaginatedResponseCompanyUserDto } from '@types';
import type { ApiResponseUnit } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class AdminCompanyUserControllerService {
    /**
     * @returns ApiResponsePaginatedResponseCompanyUserDto OK
     * @throws ApiError
     */
    public static getCompanyUsers({
        page,
        size,
        sort,
        includeDeleted = false,
        status,
        role,
    }: {
        page?: number,
        size?: number,
        sort?: string,
        includeDeleted?: boolean,
        status?: string,
        role?: string,
    }): CancelablePromise<ApiResponsePaginatedResponseCompanyUserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/company-user/users',
            query: {
                'page': page,
                'size': size,
                'sort': sort,
                'includeDeleted': includeDeleted,
                'status': status,
                'role': role,
            },
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
