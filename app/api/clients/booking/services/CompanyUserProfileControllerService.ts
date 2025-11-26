
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCompanyUserProfileDto } from '@types';
import type { UpdateCompanyUserProfileDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class CompanyUserProfileControllerService {
    /**
     * @returns ApiResponseCompanyUserProfileDto OK
     * @throws ApiError
     */
    public static updateProfile({
        requestBody,
    }: {
        requestBody: UpdateCompanyUserProfileDto,
    }): CancelablePromise<ApiResponseCompanyUserProfileDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/company-user/profile',
            body: requestBody,
            mediaType: 'application/json',
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
