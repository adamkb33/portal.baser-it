/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ApiResponseCompanySummaryDto = {
    properties: {
        success: {
            type: 'boolean',
            isRequired: true,
        },
        message: {
            type: 'string',
            isRequired: true,
        },
        data: {
            type: 'CompanySummaryDto',
        },
        errors: {
            type: 'array',
            contains: {
                type: 'ApiError',
            },
        },
        meta: {
            type: 'ApiMeta',
        },
        timestamp: {
            type: 'string',
            isRequired: true,
            format: 'date-time',
        },
    },
} as const;
