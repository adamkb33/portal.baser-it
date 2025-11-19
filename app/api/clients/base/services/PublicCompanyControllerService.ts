
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseContactDto } from '@types';
import type { ApiResponseListContactDto } from '@types';
import type { ApiResponseListPublicCompanyUserDto } from '@types';
import type { GetCompanyUsersByIdDto } from '@types';
import type { GetOrCreateContactDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class PublicCompanyControllerService {
    /**
     * @returns ApiResponseListPublicCompanyUserDto OK
     * @throws ApiError
     */
    public static getCompanyUsersByIds({
        requestBody,
    }: {
        requestBody: GetCompanyUsersByIdDto,
    }): CancelablePromise<ApiResponseListPublicCompanyUserDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public/company/users/by-ids',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseContactDto OK
     * @throws ApiError
     */
    public static getOrCreateContact({
        requestBody,
    }: {
        requestBody: GetOrCreateContactDto,
    }): CancelablePromise<ApiResponseContactDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public/company/contacts/get-or-create',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListContactDto OK
     * @throws ApiError
     */
    public static getOrCreateContacts({
        requestBody,
    }: {
        requestBody: Array<GetOrCreateContactDto>,
    }): CancelablePromise<ApiResponseListContactDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public/company/contacts/get-or-create-many',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
