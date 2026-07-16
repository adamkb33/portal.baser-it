import { Outlet } from 'react-router';
import { Container } from '~/ui';

export default function BookingPublicAppointmentSessionContactLayout() {
  return (
    <Container size="lg">
      <Outlet />
    </Container>
  );
}
