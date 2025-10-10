/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiError } from '../../common/models/ApiError';
import type { ApiMeta } from '../../common/models/ApiMeta';
import type { CompanySummaryDto } from './CompanySummaryDto';
export type ApiResponseCompanySummaryDto = {
    success: boolean;
    message: string;
    data?: CompanySummaryDto;
    errors?: Array<ApiError>;
    meta?: ApiMeta;
    timestamp: string;
};

