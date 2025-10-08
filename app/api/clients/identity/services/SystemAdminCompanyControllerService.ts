/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCompanySummaryDto } from '../models/ApiResponseCompanySummaryDto';
import type { CreateCompanyDto } from '../models/CreateCompanyDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class SystemAdminCompanyControllerService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns ApiResponseCompanySummaryDto OK
     * @throws ApiError
     */
    public createCompany({
        requestBody,
    }: {
        requestBody: CreateCompanyDto,
    }): CancelablePromise<ApiResponseCompanySummaryDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/system-admin/companies',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
