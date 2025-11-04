
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseString } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class InternalUserControllerService {
    /**
     * @returns ApiResponseString OK
     * @throws ApiError
     */
    public static test(): CancelablePromise<ApiResponseString> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/internal/users/test',
        });
    }
}
