
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCompanySummaryDto } from '@types';
import type { ApiResponseCompanyUserDto } from '@types';
import type { ApiResponseInvitedUserTokenDto } from '@types';
import type { ApiResponsePaginatedResponseCompanyUserDto } from '@types';
import type { ApiResponseUnit } from '@types';
import type { EditCompanyUserDto } from '@types';
import type { InviteCompanyUserDto } from '@types';
import type { RequestCompanyRoleDeleteDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class AdminCompanyControllerService {
    /**
     * @returns ApiResponseCompanyUserDto OK
     * @throws ApiError
     */
    public static getCompanyUser({
        companyId,
        userId,
    }: {
        companyId: number,
        userId: number,
    }): CancelablePromise<ApiResponseCompanyUserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/companies/user',
            query: {
                'companyId': companyId,
                'userId': userId,
            },
        });
    }
    /**
     * @returns ApiResponseUnit OK
     * @throws ApiError
     */
    public static editCompanyUser({
        companyId,
        userId,
        requestBody,
    }: {
        companyId: number,
        userId: number,
        requestBody: EditCompanyUserDto,
    }): CancelablePromise<ApiResponseUnit> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/admin/companies/user',
            query: {
                'companyId': companyId,
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseCompanySummaryDto OK
     * @throws ApiError
     */
    public static getCompany({
        companyId,
    }: {
        companyId: number,
    }): CancelablePromise<ApiResponseCompanySummaryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/companies',
            query: {
                'companyId': companyId,
            },
        });
    }
    /**
     * @returns ApiResponseInvitedUserTokenDto OK
     * @throws ApiError
     */
    public static inviteEmployee({
        companyId,
        requestBody,
    }: {
        companyId: number,
        requestBody: InviteCompanyUserDto,
    }): CancelablePromise<ApiResponseInvitedUserTokenDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/companies',
            query: {
                'companyId': companyId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseUnit OK
     * @throws ApiError
     */
    public static requestDeleteRole({
        companyId,
        requestBody,
    }: {
        companyId: number,
        requestBody: RequestCompanyRoleDeleteDto,
    }): CancelablePromise<ApiResponseUnit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/companies/request-role-delete',
            query: {
                'companyId': companyId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponsePaginatedResponseCompanyUserDto OK
     * @throws ApiError
     */
    public static getCompanyUsers({
        companyId,
        page,
        size,
        sort,
    }: {
        companyId: number,
        page?: number,
        size?: number,
        sort?: string,
    }): CancelablePromise<ApiResponsePaginatedResponseCompanyUserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/companies/users',
            query: {
                'companyId': companyId,
                'page': page,
                'size': size,
                'sort': sort,
            },
        });
    }
}
