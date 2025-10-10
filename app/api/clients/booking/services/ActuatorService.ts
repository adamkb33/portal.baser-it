/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Link } from '../../common/models/Link';
import type { CancelablePromise } from '../../common/core/CancelablePromise';
import { OpenAPI } from '../OpenAPI';
import { request as __request } from '../../common/core/request';
export class ActuatorService {
    /**
     * Actuator root web endpoint
     * @returns Link OK
     * @throws ApiError
     */
    public static links(): CancelablePromise<Record<string, Record<string, Link>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/actuator',
        });
    }
    /**
     * Actuator web endpoint 'info'
     * @returns any OK
     * @throws ApiError
     */
    public static info(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/actuator/info',
        });
    }
    /**
     * Actuator web endpoint 'health'
     * @returns any OK
     * @throws ApiError
     */
    public static health(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/actuator/health',
        });
    }
}
