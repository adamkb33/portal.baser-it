
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCompanySummaryDto } from '@types';
import type { ApiResponseCompanyUserDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class CompanyUserControllerService {
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
            url: '/company-user',
            query: {
                'companyId': companyId,
            },
        });
    }
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
            url: '/company-user/user',
            query: {
                'companyId': companyId,
                'userId': userId,
            },
        });
    }
}
