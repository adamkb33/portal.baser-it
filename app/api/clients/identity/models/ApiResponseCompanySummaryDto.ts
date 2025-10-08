/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiError } from './ApiError';
import type { ApiMeta } from './ApiMeta';
import type { CompanySummaryDto } from './CompanySummaryDto';
export type ApiResponseCompanySummaryDto = {
    success: boolean;
    message: string;
    data?: CompanySummaryDto;
    errors?: Array<ApiError>;
    meta?: ApiMeta;
    timestamp: string;
};

