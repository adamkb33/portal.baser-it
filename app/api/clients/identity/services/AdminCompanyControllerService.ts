
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCompanySummaryDto } from '@types';
import type { ApiResponseInvitedUserTokenDto } from '@types';
import type { ApiResponseListCompanyUserDto } from '@types';
import type { ApiResponseUnit } from '@types';
import type { InviteEmployeeDto } from '@types';
import type { RequestCompanyRoleDeleteDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class AdminCompanyControllerService {
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
        requestBody: InviteEmployeeDto,
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
     * @returns ApiResponseListCompanyUserDto OK
     * @throws ApiError
     */
    public static getCompanyUsers({
        companyId,
    }: {
        companyId: number,
    }): CancelablePromise<ApiResponseListCompanyUserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/companies/users',
            query: {
                'companyId': companyId,
            },
        });
    }
}
