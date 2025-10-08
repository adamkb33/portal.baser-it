/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiError } from './ApiError';
import type { ApiMeta } from './ApiMeta';
import type { AuthenticationTokenDto } from './AuthenticationTokenDto';
export type ApiResponseAuthenticationTokenDto = {
    success: boolean;
    message: string;
    data?: AuthenticationTokenDto;
    errors?: Array<ApiError>;
    meta?: ApiMeta;
    timestamp: string;
};

