
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseBoolean } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class InternalCompanyControllerService {
    /**
     * @returns ApiResponseBoolean OK
     * @throws ApiError
     */
    public static validateCompany({
        companyId,
    }: {
        companyId: number,
    }): CancelablePromise<ApiResponseBoolean> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/internal/internal/users/validate-company/{companyId}',
            path: {
                'companyId': companyId,
            },
        });
    }
    /**
     * @returns ApiResponseBoolean OK
     * @throws ApiError
     */
    public static validateCompanyUser({
        companyId,
        userId,
    }: {
        companyId: number,
        userId: number,
    }): CancelablePromise<ApiResponseBoolean> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/internal/internal/users/validate-company-user/{companyId}/{userId}',
            path: {
                'companyId': companyId,
                'userId': userId,
            },
        });
    }
    /**
     * @returns ApiResponseBoolean OK
     * @throws ApiError
     */
    public static validateProduct({
        companyId,
        product,
    }: {
        companyId: number,
        product: 'BOOKING' | 'EVENT' | 'TIMESHEET',
    }): CancelablePromise<ApiResponseBoolean> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/internal/internal/company-contact/validate/product/{companyId}/{product}',
            path: {
                'companyId': companyId,
                'product': product,
            },
        });
    }
    /**
     * @returns ApiResponseBoolean OK
     * @throws ApiError
     */
    public static validateContact({
        companyId,
        contactId,
    }: {
        companyId: number,
        contactId: number,
    }): CancelablePromise<ApiResponseBoolean> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/internal/internal/company-contact/validate/contact/{companyId}/{contactId}',
            path: {
                'companyId': companyId,
                'contactId': contactId,
            },
        });
    }
}
