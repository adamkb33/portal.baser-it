
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCompanySummaryDto } from '@types';
import type { CreateCompanyDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class SystemAdminCompanyControllerService {
    /**
     * @returns ApiResponseCompanySummaryDto OK
     * @throws ApiError
     */
    public static createCompany({
        requestBody,
    }: {
        requestBody: CreateCompanyDto,
    }): CancelablePromise<ApiResponseCompanySummaryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/system-admin/companies',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
