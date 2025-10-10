/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CreateUserRequestDto = {
    properties: {
        email: {
            type: 'string',
            isRequired: true,
            format: 'email',
            minLength: 1,
            pattern: '^[^@\\s]+@[^@\\s]+\\.[A-Za-z]{2,}$',
        },
        userRoles: {
            type: 'array',
            contains: {
                type: 'Enum',
            },
            isRequired: true,
        },
        companyRoles: {
            type: 'array',
            contains: {
                type: 'CompanyRoleAssignmentDto',
            },
            isRequired: true,
        },
    },
} as const;
