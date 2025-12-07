
import { setAuth, setBaseUrl } from '@http';
import * as ActuatorService from './services/ActuatorService';
import * as AppointmentsControllerService from './services/AppointmentsControllerService';
import * as BookingProfileControllerService from './services/BookingProfileControllerService';
import * as CompanyUserAppointmentControllerService from './services/CompanyUserAppointmentControllerService';
import * as CompanyUserScheduleControllerService from './services/CompanyUserScheduleControllerService';
import * as DailyScheduleControllerService from './services/DailyScheduleControllerService';
import * as PublicAppointmentSessionControllerService from './services/PublicAppointmentSessionControllerService';
import * as ServiceControllerService from './services/ServiceControllerService';
import * as ServiceGroupControllerService from './services/ServiceGroupControllerService';
import * as ServiceImageControllerService from './services/ServiceImageControllerService';

export type BookingClient = {
  ActuatorService: typeof ActuatorService;
  AppointmentsControllerService: typeof AppointmentsControllerService;
  BookingProfileControllerService: typeof BookingProfileControllerService;
  CompanyUserAppointmentControllerService: typeof CompanyUserAppointmentControllerService;
  CompanyUserScheduleControllerService: typeof CompanyUserScheduleControllerService;
  DailyScheduleControllerService: typeof DailyScheduleControllerService;
  PublicAppointmentSessionControllerService: typeof PublicAppointmentSessionControllerService;
  ServiceControllerService: typeof ServiceControllerService;
  ServiceGroupControllerService: typeof ServiceGroupControllerService;
  ServiceImageControllerService: typeof ServiceImageControllerService
};

export function createBookingClient(opts: { baseUrl: string; token?: string }): BookingClient {
  setBaseUrl(opts.baseUrl);
  setAuth(opts.token);
  return {
    ActuatorService,
    AppointmentsControllerService,
    BookingProfileControllerService,
    CompanyUserAppointmentControllerService,
    CompanyUserScheduleControllerService,
    DailyScheduleControllerService,
    PublicAppointmentSessionControllerService,
    ServiceControllerService,
    ServiceGroupControllerService,
    ServiceImageControllerService
  };
}
