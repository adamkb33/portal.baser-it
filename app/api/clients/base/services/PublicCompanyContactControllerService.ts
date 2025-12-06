
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseContactDto } from '@types';
import type { GetCreateOrUpdateContactDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class PublicCompanyContactControllerService {
    /**
     * @returns ApiResponseContactDto OK
     * @throws ApiError
     */
    public static getOrCreateContact({
        requestBody,
    }: {
        requestBody: GetCreateOrUpdateContactDto,
    }): CancelablePromise<ApiResponseContactDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public/company/contact/get-or-create',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseContactDto OK
     * @throws ApiError
     */
    public static getContact({
        companyId,
        contactId,
    }: {
        companyId: number,
        contactId: number,
    }): CancelablePromise<ApiResponseContactDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/company/contact/{companyId}/{contactId}',
            path: {
                'companyId': companyId,
                'contactId': contactId,
            },
        });
    }
}
