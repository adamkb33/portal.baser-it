import type { AppointmentDto } from '~/api/generated/booking';

export const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('nb-NO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTotalPrice = (appointment: AppointmentDto) => {
  const allServices = appointment.groupedServiceGroups?.flatMap((group) => group.services ?? []) ?? [];
  const total = allServices.reduce((sum, service) => sum + (service.price ?? 0), 0);
  return total.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' });
};

export const getTotalDuration = (appointment: AppointmentDto) => {
  const allServices = appointment.groupedServiceGroups?.flatMap((group) => group.services ?? []) ?? [];
  const total = allServices.reduce((sum, service) => sum + (service.duration ?? 0), 0);
  return `${total} min`;
};

export const getTotalServiceCount = (appointment: AppointmentDto) => {
  return appointment.groupedServiceGroups?.reduce((sum, group) => sum + (group.services?.length ?? 0), 0) ?? 0;
};
