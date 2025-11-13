
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseAppointmentDto } from '@types';
import type { ApiResponseListAppointmentDto } from '@types';
import type { CreateAppointmentCompanyUserDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class CompanyUserAppointmentControllerService {
    /**
     * @returns ApiResponseListAppointmentDto OK
     * @throws ApiError
     */
    public static getAppointments(): CancelablePromise<ApiResponseListAppointmentDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/company-user/appointments',
        });
    }
    /**
     * @returns ApiResponseAppointmentDto OK
     * @throws ApiError
     */
    public static createAppointment({
        requestBody,
    }: {
        requestBody: CreateAppointmentCompanyUserDto,
    }): CancelablePromise<ApiResponseAppointmentDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/company-user/appointments',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
