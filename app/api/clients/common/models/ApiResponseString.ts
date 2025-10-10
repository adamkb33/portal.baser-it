/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiError } from './ApiError';
import type { ApiMeta } from './ApiMeta';
export type ApiResponseString = {
    success: boolean;
    message: string;
    data?: string;
    errors?: Array<ApiError>;
    meta?: ApiMeta;
    timestamp: string;
};

