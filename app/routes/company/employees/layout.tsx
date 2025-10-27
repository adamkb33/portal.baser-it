import { Outlet } from 'react-router';
import { FloatingTodoList } from '~/components/layout/to-do-list';

export default function CompanyEmployeesLayout() {
  return (
    <div className="flex flex-col gap-4">
      <Outlet />
      <FloatingTodoList storageKey="company-employees" />
    </div>
  );
}
