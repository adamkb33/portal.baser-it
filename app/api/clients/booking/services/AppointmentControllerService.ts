/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseString } from '../../common/models/ApiResponseString';
import type { ApiResponseUnit } from '../../common/models/ApiResponseUnit';
import type { CancelablePromise } from '../../common/core/CancelablePromise';
import { OpenAPI } from '../OpenAPI';
import { request as __request } from '../../common/core/request';
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
