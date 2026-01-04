// ~/services/appointment-pagination.service.ts
export class AppointmentPaginationService {
  private searchParams: URLSearchParams;
  private navigate: (to: string, options?: { replace?: boolean }) => void;

  constructor(searchParams: URLSearchParams, navigate: (to: string, options?: { replace?: boolean }) => void) {
    this.searchParams = searchParams;
    this.navigate = navigate;
  }

  getActiveQuickFilter = (fromDate: string, toDate: string): string | null => {
    if (!fromDate && !toDate) return 'upcoming';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (fromDate && !toDate) {
      const fromDt = new Date(fromDate);
      if (Math.abs(fromDt.getTime() - now.getTime()) < 5000) {
        return 'upcoming';
      }
    }

    if (!fromDate && toDate) {
      const toDt = new Date(toDate);
      if (Math.abs(toDt.getTime() - now.getTime()) < 5000) {
        return 'past';
      }
    }

    if (fromDate && toDate) {
      const fromDt = new Date(fromDate);
      const toDt = new Date(toDate);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (fromDt.getDate() === today.getDate() && toDt.getDate() === tomorrow.getDate() - 1) {
        return 'today';
      }

      const weekStart = new Date(now);
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      weekStart.setDate(now.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      if (fromDt.getTime() === weekStart.getTime() && Math.abs(toDt.getTime() - weekEnd.getTime()) < 86400000) {
        return 'week';
      }

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      if (fromDt.getTime() === monthStart.getTime() && Math.abs(toDt.getTime() - monthEnd.getTime()) < 86400000) {
        return 'month';
      }
    }

    return null;
  };

  handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(this.searchParams);
    params.set('page', newPage.toString());
    this.navigate(`?${params.toString()}`, { replace: true });
  };

  handlePageSizeChange = (newSize: number) => {
    const params = new URLSearchParams(this.searchParams);
    params.set('size', newSize.toString());
    params.set('page', '0');
    this.navigate(`?${params.toString()}`, { replace: true });
  };

  handleSearchChange = (value: string) => {
    const params = new URLSearchParams(this.searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.set('page', '0');
    this.navigate(`?${params.toString()}`, { replace: true });
  };

  applyDateFilters = (fromDate: string, fromTime: string, toDate: string, toTime: string) => {
    const params = new URLSearchParams(this.searchParams);

    if (fromDate) {
      const fromDateTime = `${fromDate}T${fromTime || '00:00:00'}`;
      params.set('fromDateTime', fromDateTime);
    } else {
      params.delete('fromDateTime');
    }

    if (toDate) {
      const toDateTime = `${toDate}T${toTime || '23:59:59'}`;
      params.set('toDateTime', toDateTime);
    } else {
      params.delete('toDateTime');
    }

    params.set('page', '0');
    this.navigate(`?${params.toString()}`, { replace: true });
  };

  private handleQuickFilter = (from: string, to: string) => {
    const params = new URLSearchParams(this.searchParams);

    if (from) {
      params.set('fromDateTime', from);
    } else {
      params.delete('fromDateTime');
    }

    if (to) {
      params.set('toDateTime', to);
    } else {
      params.delete('toDateTime');
    }

    params.set('page', '0');
    this.navigate(`?${params.toString()}`, { replace: true });
  };

  handleUpcomingFilter = () => {
    const now = new Date().toISOString();
    this.handleQuickFilter(now, '');
  };

  handlePastFilter = () => {
    const now = new Date().toISOString();
    this.handleQuickFilter('', now);
  };

  handleTodayFilter = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setSeconds(tomorrow.getSeconds() - 1);
    this.handleQuickFilter(today.toISOString(), tomorrow.toISOString());
  };

  handleNext7days = () => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);

    this.handleQuickFilter(startDate.toISOString(), endDate.toISOString());
  };

  handleNext30Days = () => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);
    endDate.setHours(23, 59, 59, 999);

    this.handleQuickFilter(startDate.toISOString(), endDate.toISOString());
  };

  handleClearFilters = () => {
    this.navigate('?', { replace: true });
  };

  handleRemoveFilter = (filterType: 'search' | 'fromDate' | 'toDate') => {
    const params = new URLSearchParams(this.searchParams);

    switch (filterType) {
      case 'search':
        params.delete('search');
        break;
      case 'fromDate':
        params.delete('fromDateTime');
        break;
      case 'toDate':
        params.delete('toDateTime');
        break;
    }

    params.set('page', '0');
    this.navigate(`?${params.toString()}`, { replace: true });
  };
}
