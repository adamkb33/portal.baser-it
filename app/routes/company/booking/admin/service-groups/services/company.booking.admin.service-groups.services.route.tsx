import { NavLink, useNavigate, useSearchParams, useSubmit } from 'react-router';
import { useMemo, useState } from 'react';
import { ServerPaginatedTable } from '~/components/table/server-side-table';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { Badge, Button, Input, Notice, TableCell, TableRow } from '~/ui';
import { withAuth } from '~/api/utils/with-auth';
import {
  CompanyUserServiceGroupController,
  ServiceController,
  type ServiceDto,
  type ServiceGroupDto,
} from '~/api/generated/booking';
import { redirectWithInfo } from '~/routes/company/_lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { Route } from './+types/company.booking.admin.service-groups.services.route';
import { servicesActions } from './_features/services.feature';
import { resolveErrorPayload } from '~/lib/api-error';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const search = url.searchParams.get('search') || '';

    const [serviceGroupsResponse, servicesResponse] = await withAuth(request, async () =>
      Promise.all([
        CompanyUserServiceGroupController.getServiceGroups({
          query: {
            page: 0,
            size: 1000,
          },
        }),
        ServiceController.getServices({
          query: {
            page,
            size,
            ...(search && { search }),
          },
        }),
      ]),
    );

    const serviceGroups = serviceGroupsResponse.data?.data?.content || [];

    if (serviceGroups.length === 0) {
      return redirectWithInfo(
        request,
        ROUTES_MAP['company.booking.admin.service-groups'].href,
        'Du må opprette en tjenestegruppe før du kan legge til tjenester.',
      );
    }

    const pageData = servicesResponse.data?.data;

    return {
      serviceGroups,
      services: pageData?.content || [],
      pagination: {
        page: pageData?.page ?? 0,
        size: pageData?.size ?? size,
        totalElements: pageData?.totalElements ?? 0,
        totalPages: pageData?.totalPages ?? 1,
      },
    };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente tjenester');
    return {
      serviceGroups: [],
      services: [],
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

export const action = servicesActions;

export default function BookingAdminServices({ loaderData }: Route.ComponentProps) {
  const { serviceGroups, services, pagination, error } = loaderData;
  const navigate = useNavigate();
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
  const [filter, setFilter] = useState(searchParams.get('search') || '');

  const groupNameById = useMemo(
    () =>
      new Map(
        serviceGroups
          .filter((group): group is ServiceGroupDto & { id: number } => typeof group.id === 'number')
          .map((group) => [group.id, group.name] as const),
      ),
    [serviceGroups],
  );

  const handleDeleteConfirm = () => {
    if (!deletingServiceId) return;

    const formData = new FormData();
    formData.append('intent', 'delete');
    formData.append('id', String(deletingServiceId));
    submit(formData, { method: 'post' });

    setIsDeleteDialogOpen(false);
    setDeletingServiceId(null);
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

  const getServiceGroupName = (serviceGroupId: number) => groupNameById.get(serviceGroupId) || 'Ukjent';

  const formatNok = (value?: number) => {
    const amount = Number(value ?? 0);
    return amount.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' });
  };

  return (
    <>
      {error ? <Notice tone="emphasis" title="Kunne ikke hente tjenester" message={error} /> : null}

      <ServerPaginatedTable<ServiceDto>
        items={services}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowKey={(service, index) => service.id ?? `${service.name}-${index}`}
        columns={[
          { header: 'Navn', className: 'font-medium' },
          { header: 'Tjenestegruppe' },
          { header: 'Pris' },
          { header: 'Varighet' },
          { header: 'Antall bilder' },
          { header: 'Handlinger', className: 'text-right' },
        ]}
        headerSlot={
          <Input
            placeholder="Søk på navn eller tjenestegruppe…"
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value)}
            className="max-w-sm"
          />
        }
        primaryAction={
          <NavLink
            to={ROUTES_MAP['company.booking.admin.service-groups.services.create'].href}
            className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-interactive px-3 text-xs font-medium text-text-inverse transition-colors hover:bg-interactive-hover"
          >
            Legg til ny tjeneste
          </NavLink>
        }
        renderRow={(service) => (
          <TableRow>
            <TableCell className="font-medium">{service.name}</TableCell>
            <TableCell>{getServiceGroupName(service.serviceGroupId)}</TableCell>
            <TableCell>{formatNok(service.price)}</TableCell>
            <TableCell>{service.duration} min</TableCell>
            <TableCell className="flex items-center">
              {service.images && service.images.length > 0 ? (
                <Badge variant="primary" className="flex items-center justify-center">
                  {service.images.length}
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center justify-center">
                  Ingen
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <NavLink
                  to={`${ROUTES_MAP['company.booking.admin.service-groups.services.edit'].href}?id=${service.id}`}
                  className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface"
                >
                  Rediger
                </NavLink>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => {
                    setDeletingServiceId(service.id!);
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
        title="Slett tjeneste?"
        description="Er du sikker på at du vil slette denne tjenesten? Denne handlingen kan ikke angres."
      />
    </>
  );
}
