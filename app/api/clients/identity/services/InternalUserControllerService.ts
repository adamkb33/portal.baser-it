/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseString } from '../models/ApiResponseString';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class InternalUserControllerService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns ApiResponseString OK
     * @throws ApiError
     */
    public test(): CancelablePromise<ApiResponseString> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/internal/users/test',
        });
    }
}
