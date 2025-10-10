/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCompanySummaryDto } from '../models/ApiResponseCompanySummaryDto';
import type { CreateCompanyDto } from '../models/CreateCompanyDto';
import type { CancelablePromise } from '../../common/core/CancelablePromise';
import { OpenAPI } from '../OpenAPI';
import { request as __request } from '../../common/core/request';
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
