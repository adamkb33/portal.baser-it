/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $PaginationMeta = {
    properties: {
        page: {
            type: 'number',
            isRequired: true,
            format: 'int32',
        },
        size: {
            type: 'number',
            isRequired: true,
            format: 'int32',
        },
        totalElements: {
            type: 'number',
            isRequired: true,
            format: 'int64',
        },
        totalPages: {
            type: 'number',
            isRequired: true,
            format: 'int32',
        },
        isFirst: {
            type: 'boolean',
            isRequired: true,
        },
        isLast: {
            type: 'boolean',
            isRequired: true,
        },
        hasNext: {
            type: 'boolean',
            isRequired: true,
        },
        hasPrevious: {
            type: 'boolean',
            isRequired: true,
        },
    },
} as const;
