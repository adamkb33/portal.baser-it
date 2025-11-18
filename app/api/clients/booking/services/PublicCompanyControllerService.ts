
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCompanyBookingInfoDto } from '@types';
import type { ApiResponseScheduleDto } from '@types';
import type { GetPublicCompanyUserScheduleDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class PublicCompanyControllerService {
    /**
     * @returns ApiResponseScheduleDto OK
     * @throws ApiError
     */
    public static getPublicCompanyUserSchedule({
        requestBody,
    }: {
        requestBody: GetPublicCompanyUserScheduleDto,
    }): CancelablePromise<ApiResponseScheduleDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public/company/users/schedule',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
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
