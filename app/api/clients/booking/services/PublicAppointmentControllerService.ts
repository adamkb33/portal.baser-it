
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseAppointmentDto } from '@types';
import type { ApiResponseAppointmentSessionDto } from '@types';
import type { ApiResponseAppointmentSessionOverviewDto } from '@types';
import type { ApiResponseBoolean } from '@types';
import type { ApiResponseListBookingProfileDto } from '@types';
import type { ApiResponseListGroupedServiceGroupsDto } from '@types';
import type { ApiResponseListScheduleDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class PublicAppointmentControllerService {
    /**
     * @returns ApiResponseAppointmentSessionDto OK
     * @throws ApiError
     */
    public static getAppointmentSession({
        sessionId,
    }: {
        sessionId: string,
    }): CancelablePromise<ApiResponseAppointmentSessionDto> {
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
    public static appointmentSessionSubmit({
        sessionId,
    }: {
        sessionId: string,
    }): CancelablePromise<ApiResponseAppointmentDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public/appointment',
            query: {
                'sessionId': sessionId,
            },
        });
    }
    /**
     * @returns ApiResponseAppointmentSessionDto OK
     * @throws ApiError
     */
    public static selectAppointmentSessionStartTime({
        sessionId,
        selectedStartTime,
    }: {
        sessionId: string,
        selectedStartTime: string,
    }): CancelablePromise<ApiResponseAppointmentSessionDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public/appointment/select-start-time',
            query: {
                'sessionId': sessionId,
                'selectedStartTime': selectedStartTime,
            },
        });
    }
    /**
     * @returns ApiResponseAppointmentSessionDto OK
     * @throws ApiError
     */
    public static selectAppointmentSessionProfile({
        sessionId,
        selectedProfileId,
    }: {
        sessionId: string,
        selectedProfileId: number,
    }): CancelablePromise<ApiResponseAppointmentSessionDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public/appointment/select-profile',
            query: {
                'sessionId': sessionId,
                'selectedProfileId': selectedProfileId,
            },
        });
    }
    /**
     * @returns ApiResponseAppointmentSessionDto OK
     * @throws ApiError
     */
    public static selectAppointmentSessionProfileServices({
        sessionId,
        selectedServiceIds,
    }: {
        sessionId: string,
        selectedServiceIds: Array<number>,
    }): CancelablePromise<ApiResponseAppointmentSessionDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public/appointment/select-profile-services',
            query: {
                'sessionId': sessionId,
                'selectedServiceIds': selectedServiceIds,
            },
        });
    }
    /**
     * @returns ApiResponseBoolean OK
     * @throws ApiError
     */
    public static validateCompany({
        companyId,
    }: {
        companyId: number,
    }): CancelablePromise<ApiResponseBoolean> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/appointment/validate/{companyId}',
            path: {
                'companyId': companyId,
            },
        });
    }
    /**
     * @returns ApiResponseListBookingProfileDto OK
     * @throws ApiError
     */
    public static getAppointmentSessionProfiles({
        sessionId,
    }: {
        sessionId: string,
    }): CancelablePromise<ApiResponseListBookingProfileDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/appointment/get-profiles',
            query: {
                'sessionId': sessionId,
            },
        });
    }
    /**
     * @returns ApiResponseListGroupedServiceGroupsDto OK
     * @throws ApiError
     */
    public static getAppointmentSessionProfileServices({
        sessionId,
    }: {
        sessionId: string,
    }): CancelablePromise<ApiResponseListGroupedServiceGroupsDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/appointment/get-profile-services',
            query: {
                'sessionId': sessionId,
            },
        });
    }
    /**
     * @returns ApiResponseListScheduleDto OK
     * @throws ApiError
     */
    public static getAppointmentSessionSchedules({
        sessionId,
    }: {
        sessionId: string,
    }): CancelablePromise<ApiResponseListScheduleDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/appointment/get-profile-schedules',
            query: {
                'sessionId': sessionId,
            },
        });
    }
    /**
     * @returns ApiResponseAppointmentSessionDto OK
     * @throws ApiError
     */
    public static getOrCreateAppointmentSession({
        companyId,
        sessionId,
    }: {
        companyId: number,
        sessionId?: string,
    }): CancelablePromise<ApiResponseAppointmentSessionDto> {
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
     * @returns ApiResponseAppointmentSessionOverviewDto OK
     * @throws ApiError
     */
    public static getAppointmentSessionOverview({
        sessionId,
    }: {
        sessionId: string,
    }): CancelablePromise<ApiResponseAppointmentSessionOverviewDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/appointment/get-appointment-session-overview',
            query: {
                'sessionId': sessionId,
            },
        });
    }
    /**
     * @returns ApiResponseAppointmentSessionDto OK
     * @throws ApiError
     */
    public static addContactToSession({
        sessionId,
        contactId,
    }: {
        sessionId: string,
        contactId: number,
    }): CancelablePromise<ApiResponseAppointmentSessionDto> {
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
