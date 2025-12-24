import { Outlet } from 'react-router';
import TodoWidget from '~/components/todo/todo-widget';

// Loader that returns todos to make the booking system opperational

export default function CompanyBookingLayout() {
  return (
    <>
      <TodoWidget storageKey={'company-booking'} />
      <Outlet />
    </>
  );
}
