
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListDailyScheduleDto } from '@types';
import type { ApiResponseUnit } from '@types';
import type { CreateOrUpdateDailySchedulesDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class DailyScheduleControllerService {
    /**
     * @returns ApiResponseListDailyScheduleDto OK
     * @throws ApiError
     */
    public static createOrUpdateDailySchedules({
        requestBody,
    }: {
        requestBody: Array<CreateOrUpdateDailySchedulesDto>,
    }): CancelablePromise<ApiResponseListDailyScheduleDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/company-user/daily-schedules/create-or-update',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListDailyScheduleDto OK
     * @throws ApiError
     */
    public static getDailySchedules(): CancelablePromise<ApiResponseListDailyScheduleDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/company-user/daily-schedules',
        });
    }
    /**
     * @returns ApiResponseUnit OK
     * @throws ApiError
     */
    public static deleteDailySchedule({
        id,
    }: {
        id: number,
    }): CancelablePromise<ApiResponseUnit> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/company-user/daily-schedules/{id}',
            path: {
                'id': id,
            },
        });
    }
}
