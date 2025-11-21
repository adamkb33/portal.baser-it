
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
    public static validateCompanyUsers({
        companyId,
        requestBody,
    }: {
        companyId: number,
        requestBody: Array<number>,
    }): CancelablePromise<ApiResponseBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/internal/internal/users/validate-company-users/{companyId}',
            path: {
                'companyId': companyId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseBoolean OK
     * @throws ApiError
     */
    public static validateContacts({
        companyId,
        requestBody,
    }: {
        companyId: number,
        requestBody: Array<number>,
    }): CancelablePromise<ApiResponseBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/internal/internal/company-contact/validate/contacts/{companyId}',
            path: {
                'companyId': companyId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
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
