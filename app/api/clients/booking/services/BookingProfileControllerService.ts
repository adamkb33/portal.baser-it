
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCompanyUserProfileDto } from '@types';
import type { CompanyUserProfileDto } from '@types';
import type { UpdateCompanyUserProfileDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class BookingProfileControllerService {
    /**
     * @returns CompanyUserProfileDto OK
     * @throws ApiError
     */
    public static getBookingProfile(): CancelablePromise<CompanyUserProfileDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/company-user/profile',
        });
    }
    /**
     * @returns ApiResponseCompanyUserProfileDto OK
     * @throws ApiError
     */
    public static createOrUpdateProfile({
        requestBody,
    }: {
        requestBody: UpdateCompanyUserProfileDto,
    }): CancelablePromise<ApiResponseCompanyUserProfileDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/company-user/profile',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
