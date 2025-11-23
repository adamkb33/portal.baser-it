/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseAppointmentDto } from '@types';
import type { ApiResponseListAppointmentDto } from '@types';
import type { AppointmentSessionDto } from '@types';
import type { CreateAppointmentDto } from '@types';
import type { CreateAppointmentsDto } from '@types';
import type { CancelablePromise } from '@http';
import { OpenAPI } from '@http';
import { request as __request } from '@http';
export class PublicAppointmentControllerService {
  /**
   * @returns AppointmentSessionDto OK
   * @throws ApiError
   */
  public static getOrCreateSession({
    companyId,
    sessionId,
  }: {
    companyId: number;
    sessionId?: string;
  }): CancelablePromise<AppointmentSessionDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/public/appointment',
      query: {
        companyId: companyId,
        sessionId: sessionId,
      },
    });
  }
  /**
   * @returns ApiResponseAppointmentDto OK
   * @throws ApiError
   */
  public static createAppointment({
    requestBody,
  }: {
    requestBody: CreateAppointmentDto;
  }): CancelablePromise<ApiResponseAppointmentDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/public/appointment',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @returns ApiResponseListAppointmentDto OK
   * @throws ApiError
   */
  public static createAppointments({
    requestBody,
  }: {
    requestBody: CreateAppointmentsDto;
  }): CancelablePromise<ApiResponseListAppointmentDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/public/appointment/create-many',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}
