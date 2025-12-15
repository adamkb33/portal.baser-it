import { Outlet } from 'react-router';
import TodoWidget from '~/components/todo/todo-widget';

export default function CompanyBookingLayout() {
  return (
    <>
      <TodoWidget storageKey={'company-booking'} />
      <Outlet />
    </>
  );
}
