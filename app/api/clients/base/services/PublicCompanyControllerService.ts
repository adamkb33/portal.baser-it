
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListPublicCompanyUserDto } from '@types';
import type { GetCompanyUsersByIdDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class PublicCompanyControllerService {
    /**
     * @returns ApiResponseListPublicCompanyUserDto OK
     * @throws ApiError
     */
    public static getCompanyUsersByIds({
        requestBody,
    }: {
        requestBody: GetCompanyUsersByIdDto,
    }): CancelablePromise<ApiResponseListPublicCompanyUserDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public/company/users/by-ids',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
