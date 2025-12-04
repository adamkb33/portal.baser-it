
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListUserDto } from '@types';
import type { ApiResponseUserDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class InternalUserControllerService {
    /**
     * @returns ApiResponseListUserDto OK
     * @throws ApiError
     */
    public static findByIds({
        requestBody,
    }: {
        requestBody: Array<number>,
    }): CancelablePromise<ApiResponseListUserDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/internal/internal/users/batch',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseUserDto OK
     * @throws ApiError
     */
    public static findById({
        userId,
    }: {
        userId: number,
    }): CancelablePromise<ApiResponseUserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/internal/internal/users/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
}
