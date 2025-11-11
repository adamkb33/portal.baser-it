
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddCompanyRoleDto } from '@types';
import type { AddProductToCompanyDto } from '@types';
import type { ApiResponseAuthenticatedUserPayload } from '@types';
import type { ApiResponseCompanySummaryDto } from '@types';
import type { ApiResponseUnit } from '@types';
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
    /**
     * @returns ApiResponseAuthenticatedUserPayload OK
     * @throws ApiError
     */
    public static addCompanyRole({
        requestBody,
    }: {
        requestBody: AddCompanyRoleDto,
    }): CancelablePromise<ApiResponseAuthenticatedUserPayload> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/system-admin/companies/add-role',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseUnit OK
     * @throws ApiError
     */
    public static addProductsToCompany({
        requestBody,
    }: {
        requestBody: AddProductToCompanyDto,
    }): CancelablePromise<ApiResponseUnit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/system-admin/companies/add-products',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
