
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseAppointmentDto } from '@types';
import type { ApiResponseListAppointmentDto } from '@types';
import type { AppointmentSessionDto } from '@types';
import type { CreateAppointmentDto } from '@types';
import type { CreateAppointmentsDto } from '@types';
import type { GroupedServiceGroupsDto } from '@types';
import type { SelectServicesAppointmentSessionDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class PublicAppointmentControllerService {
    /**
     * @returns AppointmentSessionDto OK
     * @throws ApiError
     */
    public static getAppointmentSession({
        sessionId,
    }: {
        sessionId: string,
    }): CancelablePromise<AppointmentSessionDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/appointment',
            query: {
                'sessionId': sessionId,
            },
        });
    }
    /**
     * @returns ApiResponseAppointmentDto OK
     * @throws ApiError
     */
    public static createAppointment({
        requestBody,
    }: {
        requestBody: CreateAppointmentDto,
    }): CancelablePromise<ApiResponseAppointmentDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public/appointment',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns AppointmentSessionDto OK
     * @throws ApiError
     */
    public static selectAppointmentSessionServices({
        requestBody,
    }: {
        requestBody: SelectServicesAppointmentSessionDto,
    }): CancelablePromise<AppointmentSessionDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public/appointment/select-services',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListAppointmentDto OK
     * @throws ApiError
     */
    public static createAppointments({
        requestBody,
    }: {
        requestBody: CreateAppointmentsDto,
    }): CancelablePromise<ApiResponseListAppointmentDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public/appointment/create-many',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns AppointmentSessionDto OK
     * @throws ApiError
     */
    public static getOrCreateAppointmentSession({
        companyId,
        sessionId,
    }: {
        companyId: number,
        sessionId?: string,
    }): CancelablePromise<AppointmentSessionDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/appointment/get-or-create',
            query: {
                'companyId': companyId,
                'sessionId': sessionId,
            },
        });
    }
    /**
     * @returns GroupedServiceGroupsDto OK
     * @throws ApiError
     */
    public static getAppointmentServices({
        sessionId,
    }: {
        sessionId: string,
    }): CancelablePromise<Array<GroupedServiceGroupsDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/appointment/appointment-services',
            query: {
                'sessionId': sessionId,
            },
        });
    }
    /**
     * @returns AppointmentSessionDto OK
     * @throws ApiError
     */
    public static addContactToSession({
        sessionId,
        contactId,
    }: {
        sessionId: string,
        contactId: number,
    }): CancelablePromise<AppointmentSessionDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/appointment/add-contact-to-session/{sessionId}/{contactId}',
            path: {
                'sessionId': sessionId,
                'contactId': contactId,
            },
        });
    }
}
