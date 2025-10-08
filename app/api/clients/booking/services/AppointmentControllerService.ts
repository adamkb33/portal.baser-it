/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseString } from '../models/ApiResponseString';
import type { ApiResponseUnit } from '../models/ApiResponseUnit';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AppointmentControllerService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns ApiResponseUnit OK
     * @throws ApiError
     */
    public getAppointments(): CancelablePromise<ApiResponseUnit> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/appointments',
        });
    }
    /**
     * @returns ApiResponseString OK
     * @throws ApiError
     */
    public getUsersTest(): CancelablePromise<ApiResponseString> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/appointments/users-test',
        });
    }
}
