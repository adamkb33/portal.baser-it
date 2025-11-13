
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseScheduleDto } from '@types';
import type { GetCompanyUserScheduleDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class CompanyUserScheduleControllerService {
    /**
     * @returns ApiResponseScheduleDto OK
     * @throws ApiError
     */
    public static getSchedule({
        requestBody,
    }: {
        requestBody: GetCompanyUserScheduleDto,
    }): CancelablePromise<ApiResponseScheduleDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/company-user/schedules',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
