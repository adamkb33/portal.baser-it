
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseContactDto } from '@types';
import type { ApiResponseListContactDto } from '@types';
import type { ApiResponseUnit } from '@types';
import type { CreateContactDto } from '@types';
import type { GetContactsByIdsDto } from '@types';
import type { UpdateContactDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class CompanyUserContactControllerService {
    /**
     * @returns ApiResponseContactDto OK
     * @throws ApiError
     */
    public static updateContact({
        id,
        requestBody,
    }: {
        id: number,
        requestBody: UpdateContactDto,
    }): CancelablePromise<ApiResponseContactDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/company-user/contacts/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseUnit OK
     * @throws ApiError
     */
    public static deleteContact({
        id,
    }: {
        id: number,
    }): CancelablePromise<ApiResponseUnit> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/company-user/contacts/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseListContactDto OK
     * @throws ApiError
     */
    public static getContacts(): CancelablePromise<ApiResponseListContactDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/company-user/contacts',
        });
    }
    /**
     * @returns ApiResponseContactDto OK
     * @throws ApiError
     */
    public static createContact({
        requestBody,
    }: {
        requestBody: CreateContactDto,
    }): CancelablePromise<ApiResponseContactDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/company-user/contacts',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListContactDto OK
     * @throws ApiError
     */
    public static getContactsByIds({
        requestBody,
    }: {
        requestBody: GetContactsByIdsDto,
    }): CancelablePromise<ApiResponseListContactDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/company-user/contacts/by-ids',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
