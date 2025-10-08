/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Link } from '../models/Link';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ActuatorService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Actuator root web endpoint
     * @returns Link OK
     * @throws ApiError
     */
    public links(): CancelablePromise<Record<string, Record<string, Link>>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/actuator',
        });
    }
    /**
     * Actuator web endpoint 'info'
     * @returns any OK
     * @throws ApiError
     */
    public info(): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/actuator/info',
        });
    }
    /**
     * Actuator web endpoint 'health'
     * @returns any OK
     * @throws ApiError
     */
    public health(): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/actuator/health',
        });
    }
}
