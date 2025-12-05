
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponsePaginatedResponseAppointmentDto } from '@types';
import type { ApiResponseUnit } from '@types';
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
