/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseString } from '../../common/models/ApiResponseString';
import type { CancelablePromise } from '../../common/core/CancelablePromise';
import { OpenAPI } from '../OpenAPI';
import { request as __request } from '../../common/core/request';
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
