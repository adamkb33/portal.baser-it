
import { setAuth, setBaseUrl } from '@http';
import * as ActuatorService from './services/ActuatorService';
import * as AdminCompanyControllerService from './services/AdminCompanyControllerService';
import * as AuthControllerService from './services/AuthControllerService';
import * as CompanyUserContactControllerService from './services/CompanyUserContactControllerService';
import * as InternalCompanyContactControllerService from './services/InternalCompanyContactControllerService';
import * as InternalCompanyUserControllerService from './services/InternalCompanyUserControllerService';
import * as SystemAdminCompanyControllerService from './services/SystemAdminCompanyControllerService';
import * as SystemAdminUserControllerService from './services/SystemAdminUserControllerService';

export type BaseClient = {
  ActuatorService: typeof ActuatorService;
  AdminCompanyControllerService: typeof AdminCompanyControllerService;
  AuthControllerService: typeof AuthControllerService;
  CompanyUserContactControllerService: typeof CompanyUserContactControllerService;
  InternalCompanyContactControllerService: typeof InternalCompanyContactControllerService;
  InternalCompanyUserControllerService: typeof InternalCompanyUserControllerService;
  SystemAdminCompanyControllerService: typeof SystemAdminCompanyControllerService;
  SystemAdminUserControllerService: typeof SystemAdminUserControllerService
};

export function createBaseClient(opts: { baseUrl: string; token?: string }): BaseClient {
  setBaseUrl(opts.baseUrl);
  setAuth(opts.token);
  return {
    ActuatorService,
    AdminCompanyControllerService,
    AuthControllerService,
    CompanyUserContactControllerService,
    InternalCompanyContactControllerService,
    InternalCompanyUserControllerService,
    SystemAdminCompanyControllerService,
    SystemAdminUserControllerService
  };
}
