/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddressDto } from './AddressDto';
import type { OrganizationTypeDto } from './OrganizationTypeDto';
export type CompanySummaryDto = {
    id: number;
    orgNumber: string;
    name: string;
    organizationType: OrganizationTypeDto;
    postalAddress: AddressDto;
    businessAddress: AddressDto;
};

