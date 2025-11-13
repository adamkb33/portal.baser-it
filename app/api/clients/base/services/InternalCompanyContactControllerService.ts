
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseBoolean } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class InternalCompanyContactControllerService {
    /**
     * @returns ApiResponseBoolean OK
     * @throws ApiError
     */
    public static validateCompanyContact(): CancelablePromise<ApiResponseBoolean> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/internal/company-contact/validate',
        });
    }
}
