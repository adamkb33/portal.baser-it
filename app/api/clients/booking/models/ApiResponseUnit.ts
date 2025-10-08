/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiError } from './ApiError';
import type { ApiMeta } from './ApiMeta';
export type ApiResponseUnit = {
    success: boolean;
    message: string;
    errors?: Array<ApiError>;
    meta?: ApiMeta;
    timestamp: string;
};

