// ~/services/appointment-pagination.service.ts

export enum AppointmentPaginationQuickFilter {
  UPCOMING,
  PAST,
  TODAY,
  NEXT_7_DAYS,
  NEXT_30_DAYS,
}

export class AppointmentPaginationService {
  private searchParams: URLSearchParams;
  private navigate: (to: string, options?: { replace?: boolean }) => void;

  constructor(searchParams: URLSearchParams, navigate: (to: string, options?: { replace?: boolean }) => void) {
    this.searchParams = searchParams;
    this.navigate = navigate;
  }

  getActiveQuickFilter = (): AppointmentPaginationQuickFilter | null => {
    const fromDate = this.searchParams.get('fromDateTime');
    const toDate = this.searchParams.get('toDateTime');

    if (!fromDate && !toDate) return AppointmentPaginationQuickFilter.UPCOMING;

    // UPCOMING: fromDate exists, no toDate
    if (fromDate && !toDate) {
      return AppointmentPaginationQuickFilter.UPCOMING;
    }

    // PAST: no fromDate, toDate exists
    if (!fromDate && toDate) {
      return AppointmentPaginationQuickFilter.PAST;
    }

    if (fromDate && toDate) {
      const fromDt = new Date(fromDate);
      const toDt = new Date(toDate);

      // Check if fromDate is midnight (00:00:00 or 23:00:00 UTC for CET)
      const isMidnight = fromDt.getUTCHours() === 0 || fromDt.getUTCHours() === 23;

      // Check if toDate is end-of-day (22:59:59.999Z or 23:59:59.999)
      const isEndOfDay =
        (toDt.getUTCHours() === 22 || toDt.getUTCHours() === 23) &&
        toDt.getUTCMinutes() === 59 &&
        toDt.getUTCSeconds() === 59;

      if (isMidnight && isEndOfDay) {
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const daysDiff = Math.round((toDt.getTime() - fromDt.getTime()) / (1000 * 60 * 60 * 24));
        const daysFromToday = Math.round((fromDt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // TODAY: 1-day range starting today
        if ((daysDiff === 0 || daysDiff === 1) && Math.abs(daysFromToday) <= 1) {
          return AppointmentPaginationQuickFilter.TODAY;
        }

        // NEXT_7_DAYS: 7-8 day range starting today
        if (daysDiff >= 7 && daysDiff <= 8 && Math.abs(daysFromToday) <= 1) {
          return AppointmentPaginationQuickFilter.NEXT_7_DAYS;
        }

        // NEXT_30_DAYS: 30-31 day range starting today
        if (daysDiff >= 30 && daysDiff <= 31 && Math.abs(daysFromToday) <= 1) {
          return AppointmentPaginationQuickFilter.NEXT_30_DAYS;
        }
      }
    }

    return null;
  };

  getDirection = (): 'ASC' | 'DESC' | undefined => {
    const dir = this.searchParams.get('direction');
    return dir === 'ASC' || dir === 'DESC' ? dir : undefined;
  };

  setDirection = (direction: 'ASC' | 'DESC' | undefined): void => {
    const params = new URLSearchParams(this.searchParams);
    const currentDirection = this.searchParams.get('direction');

    if (direction === currentDirection) {
      params.delete('direction');
    } else if (direction === 'ASC' || direction === 'DESC') {
      params.set('direction', direction);
    } else {
      params.delete('direction');
    }

    params.set('page', '0');
    this.navigate(`?${params.toString()}`, { replace: true });
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

  applyDateFilters = (fromDate: string, toDate: string) => {
    const params = new URLSearchParams(this.searchParams);

    if (fromDate) {
      const fromDateTime = `${fromDate}T00:00:00`;
      params.set('fromDateTime', fromDateTime);
    } else {
      params.delete('fromDateTime');
    }

    if (toDate) {
      const toDateTime = `${toDate}T23:59:59`;
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
