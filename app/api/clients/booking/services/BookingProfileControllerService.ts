
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseBookingProfileDto } from '@types';
import type { BookingProfileDto } from '@types';
import type { UpdateCompanyUserProfileDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class BookingProfileControllerService {
    /**
     * @returns BookingProfileDto OK
     * @throws ApiError
     */
    public static getBookingProfile(): CancelablePromise<BookingProfileDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/company-user/profile',
        });
    }
    /**
     * @returns ApiResponseBookingProfileDto OK
     * @throws ApiError
     */
    public static createOrUpdateProfile({
        requestBody,
    }: {
        requestBody: UpdateCompanyUserProfileDto,
    }): CancelablePromise<ApiResponseBookingProfileDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/company-user/profile',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
