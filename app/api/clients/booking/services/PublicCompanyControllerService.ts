
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCompanyBookingInfoDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class PublicCompanyControllerService {
    /**
     * @returns ApiResponseCompanyBookingInfoDto OK
     * @throws ApiError
     */
    public static getCompanyBookingInfo({
        companyId,
    }: {
        companyId: number,
    }): CancelablePromise<ApiResponseCompanyBookingInfoDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/company/{companyId}/booking-info',
            path: {
                'companyId': companyId,
            },
        });
    }
}
