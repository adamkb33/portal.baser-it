
import { setAuth, setBaseUrl } from '@http';
import * as ActuatorService from './services/ActuatorService';
import * as AdminCompanyControllerService from './services/AdminCompanyControllerService';
import * as AuthControllerService from './services/AuthControllerService';
import * as InternalUserControllerService from './services/InternalUserControllerService';
import * as SystemAdminCompanyControllerService from './services/SystemAdminCompanyControllerService';
import * as SystemAdminUserControllerService from './services/SystemAdminUserControllerService';

export type IdentityClient = {
  ActuatorService: typeof ActuatorService;
  AdminCompanyControllerService: typeof AdminCompanyControllerService;
  AuthControllerService: typeof AuthControllerService;
  InternalUserControllerService: typeof InternalUserControllerService;
  SystemAdminCompanyControllerService: typeof SystemAdminCompanyControllerService;
  SystemAdminUserControllerService: typeof SystemAdminUserControllerService
};

export function createIdentityClient(opts: { baseUrl: string; token?: string }): IdentityClient {
  setBaseUrl(opts.baseUrl);
  setAuth(opts.token);
  return {
    ActuatorService,
    AdminCompanyControllerService,
    AuthControllerService,
    InternalUserControllerService,
    SystemAdminCompanyControllerService,
    SystemAdminUserControllerService
  };
}
