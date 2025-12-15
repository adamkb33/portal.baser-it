import { Outlet } from 'react-router';
import TodoWidget from '~/components/todo/todo-widget';

export default function CompanyAdminEmployeesLayout() {
  return (
    <>
      <TodoWidget storageKey="my-app-todos" />
      <Outlet />
    </>
  );
}
