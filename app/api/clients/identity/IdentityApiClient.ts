/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { ActuatorService } from './services/ActuatorService';
import { AuthControllerService } from './services/AuthControllerService';
import { InternalUserControllerService } from './services/InternalUserControllerService';
import { SystemAdminCompanyControllerService } from './services/SystemAdminCompanyControllerService';
import { SystemAdminUserControllerService } from './services/SystemAdminUserControllerService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class IdentityApiClient {
    public readonly actuator: ActuatorService;
    public readonly authController: AuthControllerService;
    public readonly internalUserController: InternalUserControllerService;
    public readonly systemAdminCompanyController: SystemAdminCompanyControllerService;
    public readonly systemAdminUserController: SystemAdminUserControllerService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? 'http://localhost:8010',
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
        this.authController = new AuthControllerService(this.request);
        this.internalUserController = new InternalUserControllerService(this.request);
        this.systemAdminCompanyController = new SystemAdminCompanyControllerService(this.request);
        this.systemAdminUserController = new SystemAdminUserControllerService(this.request);
    }
}

