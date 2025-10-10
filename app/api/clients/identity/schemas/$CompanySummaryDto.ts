/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CompanySummaryDto = {
    properties: {
        id: {
            type: 'number',
            isRequired: true,
            format: 'int64',
        },
        orgNumber: {
            type: 'string',
            isRequired: true,
        },
        name: {
            type: 'string',
            isRequired: true,
        },
        organizationType: {
            type: 'OrganizationTypeDto',
            isRequired: true,
        },
        postalAddress: {
            type: 'AddressDto',
            isRequired: true,
        },
        businessAddress: {
            type: 'AddressDto',
            isRequired: true,
        },
    },
} as const;
