
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseContactDto } from '@types';
import type { ApiResponseListContactDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class InternalContactControllerService {
    /**
     * @returns ApiResponseListContactDto OK
     * @throws ApiError
     */
    public static findByIds1({
        requestBody,
    }: {
        requestBody: Array<number>,
    }): CancelablePromise<ApiResponseListContactDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/internal/contacts/batch',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseContactDto OK
     * @throws ApiError
     */
    public static findById1({
        contactId,
    }: {
        contactId: number,
    }): CancelablePromise<ApiResponseContactDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/internal/contacts/{contactId}',
            path: {
                'contactId': contactId,
            },
        });
    }
}
