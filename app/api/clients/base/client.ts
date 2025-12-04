
import { setAuth, setBaseUrl } from '@http';
import * as ActuatorService from './services/ActuatorService';
import * as AdminCompanyControllerService from './services/AdminCompanyControllerService';
import * as AuthControllerService from './services/AuthControllerService';
import * as CompanyUserContactControllerService from './services/CompanyUserContactControllerService';
import * as CompanyUserControllerService from './services/CompanyUserControllerService';
import * as InternalCompanyControllerService from './services/InternalCompanyControllerService';
import * as InternalUserControllerService from './services/InternalUserControllerService';
import * as PublicCompanyContactControllerService from './services/PublicCompanyContactControllerService';
import * as PublicCompanyControllerService from './services/PublicCompanyControllerService';
import * as SystemAdminCompanyControllerService from './services/SystemAdminCompanyControllerService';
import * as SystemAdminUserControllerService from './services/SystemAdminUserControllerService';
import * as UserControllerService from './services/UserControllerService';

export type BaseClient = {
  ActuatorService: typeof ActuatorService;
  AdminCompanyControllerService: typeof AdminCompanyControllerService;
  AuthControllerService: typeof AuthControllerService;
  CompanyUserContactControllerService: typeof CompanyUserContactControllerService;
  CompanyUserControllerService: typeof CompanyUserControllerService;
  InternalCompanyControllerService: typeof InternalCompanyControllerService;
  InternalUserControllerService: typeof InternalUserControllerService;
  PublicCompanyContactControllerService: typeof PublicCompanyContactControllerService;
  PublicCompanyControllerService: typeof PublicCompanyControllerService;
  SystemAdminCompanyControllerService: typeof SystemAdminCompanyControllerService;
  SystemAdminUserControllerService: typeof SystemAdminUserControllerService;
  UserControllerService: typeof UserControllerService
};

export function createBaseClient(opts: { baseUrl: string; token?: string }): BaseClient {
  setBaseUrl(opts.baseUrl);
  setAuth(opts.token);
  return {
    ActuatorService,
    AdminCompanyControllerService,
    AuthControllerService,
    CompanyUserContactControllerService,
    CompanyUserControllerService,
    InternalCompanyControllerService,
    InternalUserControllerService,
    PublicCompanyContactControllerService,
    PublicCompanyControllerService,
    SystemAdminCompanyControllerService,
    SystemAdminUserControllerService,
    UserControllerService
  };
}
