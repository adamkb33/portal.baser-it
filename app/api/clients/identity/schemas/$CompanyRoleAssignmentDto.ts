/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CompanyRoleAssignmentDto = {
    properties: {
        companyId: {
            type: 'number',
            isRequired: true,
            format: 'int64',
        },
        role: {
            type: 'Enum',
            isRequired: true,
        },
    },
} as const;
