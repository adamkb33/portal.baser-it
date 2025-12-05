
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseBoolean } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class PublicCompanyControllerService {
    /**
     * @returns ApiResponseBoolean OK
     * @throws ApiError
     */
    public static getCompanyBookingInfo({
        companyId,
    }: {
        companyId: number,
    }): CancelablePromise<ApiResponseBoolean> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/company/{companyId}/booking-info',
            path: {
                'companyId': companyId,
            },
        });
    }
}
