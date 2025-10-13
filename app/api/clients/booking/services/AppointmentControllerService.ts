
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseString } from '@types';
import type { ApiResponseUnit } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class AppointmentControllerService {
    /**
     * @returns ApiResponseUnit OK
     * @throws ApiError
     */
    public static getAppointments(): CancelablePromise<ApiResponseUnit> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/appointments',
        });
    }
    /**
     * @returns ApiResponseString OK
     * @throws ApiError
     */
    public static getUsersTest(): CancelablePromise<ApiResponseString> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/appointments/users-test',
        });
    }
}
