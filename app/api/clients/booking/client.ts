
import { setAuth, setBaseUrl } from '@http';
import * as ActuatorService from './services/ActuatorService';
import * as DailyScheduleControllerService from './services/DailyScheduleControllerService';
import * as ServiceControllerService from './services/ServiceControllerService';
import * as ServiceGroupControllerService from './services/ServiceGroupControllerService';

export type BookingClient = {
  ActuatorService: typeof ActuatorService;
  DailyScheduleControllerService: typeof DailyScheduleControllerService;
  ServiceControllerService: typeof ServiceControllerService;
  ServiceGroupControllerService: typeof ServiceGroupControllerService
};

export function createBookingClient(opts: { baseUrl: string; token?: string }): BookingClient {
  setBaseUrl(opts.baseUrl);
  setAuth(opts.token);
  return {
    ActuatorService,
    DailyScheduleControllerService,
    ServiceControllerService,
    ServiceGroupControllerService
  };
}
