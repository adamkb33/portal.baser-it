
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseUserDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class UserControllerService {
    /**
     * @returns ApiResponseUserDto OK
     * @throws ApiError
     */
    public static getAuthenticatedUser(): CancelablePromise<ApiResponseUserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user',
        });
    }
}
