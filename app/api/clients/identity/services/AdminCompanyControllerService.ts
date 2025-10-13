
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCompanySummaryDto } from '@types';
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
}
