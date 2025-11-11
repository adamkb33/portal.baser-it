
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListServiceDto } from '@types';
import type { ApiResponseServiceDto } from '@types';
import type { ApiResponseUnit } from '@types';
import type { CreateServiceDto } from '@types';
import type { UpdateServiceDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class ServiceControllerService {
    /**
     * @returns ApiResponseServiceDto OK
     * @throws ApiError
     */
    public static updateService({
        id,
        requestBody,
    }: {
        id: number,
        requestBody: UpdateServiceDto,
    }): CancelablePromise<ApiResponseServiceDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/company-user/services/{id}',
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
    public static deleteService({
        id,
    }: {
        id: number,
    }): CancelablePromise<ApiResponseUnit> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/company-user/services/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseListServiceDto OK
     * @throws ApiError
     */
    public static getServices(): CancelablePromise<ApiResponseListServiceDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/company-user/services',
        });
    }
    /**
     * @returns ApiResponseServiceDto OK
     * @throws ApiError
     */
    public static createService({
        requestBody,
    }: {
        requestBody: CreateServiceDto,
    }): CancelablePromise<ApiResponseServiceDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/company-user/services',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
