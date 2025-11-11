
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListServiceGroupDto } from '@types';
import type { ApiResponseServiceGroupDto } from '@types';
import type { ApiResponseUnit } from '@types';
import type { CreateServiceGroupDto } from '@types';
import type { UpdateServiceGroupDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class ServiceGroupControllerService {
    /**
     * @returns ApiResponseServiceGroupDto OK
     * @throws ApiError
     */
    public static updateServiceGroup({
        id,
        requestBody,
    }: {
        id: number,
        requestBody: UpdateServiceGroupDto,
    }): CancelablePromise<ApiResponseServiceGroupDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/company-user/service-groups/{id}',
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
    public static deleteServiceGroup({
        id,
    }: {
        id: number,
    }): CancelablePromise<ApiResponseUnit> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/company-user/service-groups/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseListServiceGroupDto OK
     * @throws ApiError
     */
    public static getServiceGroups(): CancelablePromise<ApiResponseListServiceGroupDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/company-user/service-groups',
        });
    }
    /**
     * @returns ApiResponseServiceGroupDto OK
     * @throws ApiError
     */
    public static createServiceGroup({
        requestBody,
    }: {
        requestBody: CreateServiceGroupDto,
    }): CancelablePromise<ApiResponseServiceGroupDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/company-user/service-groups',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
