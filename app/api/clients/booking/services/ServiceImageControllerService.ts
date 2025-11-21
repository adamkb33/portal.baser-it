/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListServiceImageDto } from '@types';
import type { ApiResponseServiceImageDto } from '@types';
import type { ApiResponseUnit } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class ServiceImageControllerService {
  /**
   * @returns ApiResponseListServiceImageDto OK
   * @throws ApiError
   */
  public static getImages({ serviceId }: { serviceId: number }): CancelablePromise<ApiResponseListServiceImageDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/company-user/service-images/{serviceId}/images',
      path: {
        serviceId: serviceId,
      },
    });
  }
  /**
   * @returns ApiResponseServiceImageDto OK
   * @throws ApiError
   */
  public static uploadImage({
    serviceId,
    requestBody,
  }: {
    serviceId: number;
    requestBody?: {
      file: Blob;
      label: string;
    };
  }): CancelablePromise<ApiResponseServiceImageDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/company-user/service-images/{serviceId}/images',
      path: {
        serviceId: serviceId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @returns ApiResponseListServiceImageDto OK
   * @throws ApiError
   */
  public static uploadBulk({
    serviceId,
    requestBody,
  }: {
    serviceId: number;
    requestBody?: {
      files: Array<Blob>;
      labels: Array<string>;
    };
  }): CancelablePromise<ApiResponseListServiceImageDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/company-user/service-images/{serviceId}/images/bulk',
      path: {
        serviceId: serviceId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @returns ApiResponseUnit OK
   * @throws ApiError
   */
  public static deleteImage({
    serviceId,
    imageId,
  }: {
    serviceId: number;
    imageId: number;
  }): CancelablePromise<ApiResponseUnit> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/company-user/service-images/{serviceId}/images/{imageId}',
      path: {
        serviceId: serviceId,
        imageId: imageId,
      },
    });
  }
}
