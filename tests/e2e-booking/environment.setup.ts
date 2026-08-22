import { expect, seedBookingFixture, test } from './fixtures';

test('fresh PostgreSQL database is migrated and contains the booking seed', async ({ db }) => {
  const migrations = await db.query<{ failed: string }>(`
    select count(*) filter (where not success)::text as failed
    from public.flyway_schema_history
  `);
  expect(migrations.rows[0]?.failed).toBe('0');

  await seedBookingFixture(db);

  const fixture = await db.query<{ companies: string; profiles: string; services: string; schedules: string }>(`
    select
      (select count(*)::text from base.companies where id = 1 and deleted_at is null) as companies,
      (select count(*)::text from booking.booking_profiles where company_id = 1 and deleted_at is null) as profiles,
      (select count(*)::text from booking.services where company_id = 1 and deleted_at is null) as services,
      (
        select count(*)::text
        from booking.daily_schedules schedule
        join booking.booking_profiles profile on profile.id = schedule.profile_id
        where profile.company_id = 1 and schedule.deleted_at is null
      ) as schedules
  `);

  expect(fixture.rows[0]).toEqual({ companies: '1', profiles: '1', services: '4', schedules: '6' });
});
