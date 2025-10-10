/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ApiResponseUnit = {
    properties: {
        success: {
            type: 'boolean',
            isRequired: true,
        },
        message: {
            type: 'string',
            isRequired: true,
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
