/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompanyRoleAssignmentDto } from './CompanyRoleAssignmentDto';
export type CreateUserRequestDto = {
    email: string;
    userRoles: Array<'SYSTEM_ADMIN' | 'USER'>;
    companyRoles: Array<CompanyRoleAssignmentDto>;
};

