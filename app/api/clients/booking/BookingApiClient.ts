/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { ActuatorService } from './services/ActuatorService';
import { AppointmentControllerService } from './services/AppointmentControllerService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class BookingApiClient {
    public readonly actuator: ActuatorService;
    public readonly appointmentController: AppointmentControllerService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? 'http://localhost:8020',
            VERSION: config?.VERSION ?? '0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.actuator = new ActuatorService(this.request);
        this.appointmentController = new AppointmentControllerService(this.request);
    }
}

