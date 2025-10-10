/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $AuthenticationTokenDto = {
    properties: {
        accessToken: {
            type: 'string',
            isRequired: true,
        },
        accessTokenExpiresAt: {
            type: 'number',
            isRequired: true,
            format: 'int64',
        },
        refreshToken: {
            type: 'string',
            isRequired: true,
        },
        refreshTokenExpiresAt: {
            type: 'number',
            isRequired: true,
            format: 'int64',
        },
    },
} as const;
