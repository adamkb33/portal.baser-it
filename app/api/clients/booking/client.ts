
import { setAuth, setBaseUrl } from '@http';
import * as ActuatorService from './services/ActuatorService';
import * as CompanyUserAppointmentControllerService from './services/CompanyUserAppointmentControllerService';
import * as CompanyUserScheduleControllerService from './services/CompanyUserScheduleControllerService';
import * as DailyScheduleControllerService from './services/DailyScheduleControllerService';
import * as PublicAppointmentControllerService from './services/PublicAppointmentControllerService';
import * as PublicCompanyControllerService from './services/PublicCompanyControllerService';
import * as ServiceControllerService from './services/ServiceControllerService';
import * as ServiceGroupControllerService from './services/ServiceGroupControllerService';
import * as ServiceImageControllerService from './services/ServiceImageControllerService';

export type BookingClient = {
  ActuatorService: typeof ActuatorService;
  CompanyUserAppointmentControllerService: typeof CompanyUserAppointmentControllerService;
  CompanyUserScheduleControllerService: typeof CompanyUserScheduleControllerService;
  DailyScheduleControllerService: typeof DailyScheduleControllerService;
  PublicAppointmentControllerService: typeof PublicAppointmentControllerService;
  PublicCompanyControllerService: typeof PublicCompanyControllerService;
  ServiceControllerService: typeof ServiceControllerService;
  ServiceGroupControllerService: typeof ServiceGroupControllerService;
  ServiceImageControllerService: typeof ServiceImageControllerService
};

export function createBookingClient(opts: { baseUrl: string; token?: string }): BookingClient {
  setBaseUrl(opts.baseUrl);
  setAuth(opts.token);
  return {
    ActuatorService,
    CompanyUserAppointmentControllerService,
    CompanyUserScheduleControllerService,
    DailyScheduleControllerService,
    PublicAppointmentControllerService,
    PublicCompanyControllerService,
    ServiceControllerService,
    ServiceGroupControllerService,
    ServiceImageControllerService
  };
}
