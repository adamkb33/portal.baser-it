
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseAppointmentDto } from '@types';
import type { ApiResponsePaginatedResponseAppointmentDto } from '@types';
import type { ApiResponseUnit } from '@types';
import type { CreateAppointmentCompanyUserDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class CompanyUserAppointmentControllerService {
    /**
     * @returns ApiResponsePaginatedResponseAppointmentDto OK
     * @throws ApiError
     */
    public static getAppointments({
        page,
        size,
        sortBy,
        sortDirection,
        fromDateTime,
        toDateTime,
    }: {
        page?: number,
        size?: number,
        sortBy?: string,
        sortDirection?: string,
        fromDateTime?: string,
        toDateTime?: string,
    }): CancelablePromise<ApiResponsePaginatedResponseAppointmentDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/company-user/appointments',
            query: {
                'page': page,
                'size': size,
                'sortBy': sortBy,
                'sortDirection': sortDirection,
                'fromDateTime': fromDateTime,
                'toDateTime': toDateTime,
            },
        });
    }
    /**
     * @returns ApiResponseAppointmentDto OK
     * @throws ApiError
     */
    public static createAppointment1({
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
    /**
     * @returns ApiResponseUnit OK
     * @throws ApiError
     */
    public static deleteAppointment({
        id,
    }: {
        id: number,
    }): CancelablePromise<ApiResponseUnit> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/company-user/appointments/{id}',
            path: {
                'id': id,
            },
        });
    }
}
