
import { setAuth, setBaseUrl } from '@http';
import * as ActuatorService from './services/ActuatorService';
import * as AppointmentControllerService from './services/AppointmentControllerService';

export type BookingClient = {
  ActuatorService: typeof ActuatorService;
  AppointmentControllerService: typeof AppointmentControllerService
};

export function createBookingClient(opts: { baseUrl: string; token?: string }): BookingClient {
  setBaseUrl(opts.baseUrl);
  setAuth(opts.token);
  return {
    ActuatorService,
    AppointmentControllerService
  };
}
