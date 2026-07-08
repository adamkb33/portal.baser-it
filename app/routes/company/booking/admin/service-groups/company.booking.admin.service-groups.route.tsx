import { NavLink, useNavigate, useSearchParams, useSubmit } from 'react-router';
import { useState } from 'react';
import { ServerPaginatedTable } from '~/components/table/server-side-table';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { Button, Input, Notice, TableCell, TableRow } from '~/ui';
import type { Route } from './+types/company.booking.admin.service-groups.route';
import { CompanyUserServiceGroupController, type ServiceGroupDto } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { API_ROUTES_MAP, ROUTES_MAP } from '~/lib/routing/route-tree';
import { resolveErrorPayload } from '~/lib/api-error';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const search = url.searchParams.get('search') || '';

    const response = await withAuth(request, async () =>
      CompanyUserServiceGroupController.getServiceGroups({
        query: {
          page,
          size,
          ...(search && { search }),
        },
      }),
    );

    const pageData = response.data?.data;

    return {
      serviceGroups: pageData?.content || [],
      pagination: {
        page: pageData?.page ?? 0,
        size: pageData?.size ?? size,
        totalElements: pageData?.totalElements ?? 0,
        totalPages: pageData?.totalPages ?? 1,
      },
    };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente tjenestegrupper');
    return {
      serviceGroups: [],
      pagination: {
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 1,
      },
      error: message,
    };
  }
}

export default function BookingServiceGroups({ loaderData }: Route.ComponentProps) {
  const { serviceGroups, pagination, error } = loaderData;
  const navigate = useNavigate();
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingServiceGroupId, setDeletingServiceGroupId] = useState<number | null>(null);
  const [filter, setFilter] = useState(searchParams.get('search') || '');

  const handleDeleteConfirm = () => {
    if (!deletingServiceGroupId) return;

    const formData = new FormData();
    formData.append('id', String(deletingServiceGroupId));
    submit(formData, {
      method: 'post',
      action: API_ROUTES_MAP['company.booking.admin.service-groups.delete'].url,
    });

    setIsDeleteDialogOpen(false);
    setDeletingServiceGroupId(null);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.set('page', '0');
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handlePageSizeChange = (newSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('size', newSize.toString());
    params.set('page', '0');
    navigate(`?${params.toString()}`, { replace: true });
  };

  return (
    <>
      {error ? <Notice tone="emphasis" title="Kunne ikke hente tjenestegrupper" message={error} /> : null}

      <ServerPaginatedTable<ServiceGroupDto>
        items={serviceGroups}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowKey={(serviceGroup, index) => serviceGroup.id ?? `group-${index}`}
        columns={[
          { header: 'ID' },
          { header: 'Navn', className: 'font-medium' },
          { header: 'Handlinger', className: 'text-right' },
        ]}
        headerSlot={
          <Input
            placeholder="Søk på navn..."
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value)}
            className="max-w-sm"
          />
        }
        primaryAction={
          <Button asChild size="sm">
            <NavLink to={ROUTES_MAP['company.booking.admin.service-groups.create'].href}>
              Legg til ny tjenestegruppe
            </NavLink>
          </Button>
        }
        mobilePrimaryAction={
          <Button asChild size="sm">
            <NavLink to={ROUTES_MAP['company.booking.admin.service-groups.create'].href}>Ny tjenestegruppe</NavLink>
          </Button>
        }
        renderRow={(serviceGroup) => (
          <TableRow>
            <TableCell>{serviceGroup.id}</TableCell>
            <TableCell className="font-medium">{serviceGroup.name}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <NavLink to={`${ROUTES_MAP['company.booking.admin.service-groups.edit'].href}?id=${serviceGroup.id}`}>
                    Rediger
                  </NavLink>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => {
                    setDeletingServiceGroupId(serviceGroup.id!);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  Slett
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Slett tjenestegruppe?"
        description="Er du sikker på at du vil slette denne tjenestegruppen? Denne handlingen kan ikke angres."
      />
    </>
  );
}
