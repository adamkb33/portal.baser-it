
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseBoolean } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class AppointmentsControllerService {
    /**
     * @returns ApiResponseBoolean OK
     * @throws ApiError
     */
    public static validateCompanyBooking({
        companyId,
    }: {
        companyId: number,
    }): CancelablePromise<ApiResponseBoolean> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/appointments/validate-company/{companyId}',
            path: {
                'companyId': companyId,
            },
        });
    }
}
