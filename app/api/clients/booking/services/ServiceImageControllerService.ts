
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseImageDto } from '@types';
import type { ApiResponseListImageDto } from '@types';
import type { ApiResponseUnit } from '@types';
import type { BulkImageUploadRequest } from '@types';
import type { SingleImageUploadRequest } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class ServiceImageControllerService {
    /**
     * @returns ApiResponseListImageDto OK
     * @throws ApiError
     */
    public static getImages({
        serviceId,
    }: {
        serviceId: number,
    }): CancelablePromise<ApiResponseListImageDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/company-user/service-images/{serviceId}/images',
            path: {
                'serviceId': serviceId,
            },
        });
    }
    /**
     * @returns ApiResponseImageDto OK
     * @throws ApiError
     */
    public static uploadImage({
        serviceId,
        requestBody,
    }: {
        serviceId: number,
        requestBody: SingleImageUploadRequest,
    }): CancelablePromise<ApiResponseImageDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/company-user/service-images/{serviceId}/images',
            path: {
                'serviceId': serviceId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListImageDto OK
     * @throws ApiError
     */
    public static uploadBulk({
        serviceId,
        requestBody,
    }: {
        serviceId: number,
        requestBody: BulkImageUploadRequest,
    }): CancelablePromise<ApiResponseListImageDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/company-user/service-images/{serviceId}/images/bulk',
            path: {
                'serviceId': serviceId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseUnit OK
     * @throws ApiError
     */
    public static deleteImage({
        serviceId,
        imageId,
    }: {
        serviceId: number,
        imageId: number,
    }): CancelablePromise<ApiResponseUnit> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/company-user/service-images/{serviceId}/images/{imageId}',
            path: {
                'serviceId': serviceId,
                'imageId': imageId,
            },
        });
    }
}
