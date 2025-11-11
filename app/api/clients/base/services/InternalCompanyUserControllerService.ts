
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseBoolean } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class InternalCompanyUserControllerService {
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
            url: '/internal/users/validate-company-user/{companyId}/{userId}',
            path: {
                'companyId': companyId,
                'userId': userId,
            },
        });
    }
}
