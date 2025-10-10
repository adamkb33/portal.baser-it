/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $AddressDto = {
    properties: {
        municipality: {
            type: 'string',
        },
        countryCode: {
            type: 'string',
        },
        postalCode: {
            type: 'string',
        },
        addressLines: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        country: {
            type: 'string',
        },
        municipalityCode: {
            type: 'string',
        },
        city: {
            type: 'string',
        },
    },
} as const;
