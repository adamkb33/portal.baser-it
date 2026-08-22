import { expect, test as base } from '@playwright/test';
import { Pool } from 'pg';

export const test = base.extend<{}, { db: Pool }>({
  db: [
    async ({}, use) => {
      const connectionString = process.env.E2E_DATABASE_URL;
      if (!connectionString) {
        throw new Error('E2E_DATABASE_URL is required. Run this suite through npm run test:e2e:booking.');
      }

      const pool = new Pool({
        connectionString,
        max: 4,
        application_name: 'portal-playwright-booking',
      });
      await pool.query('select 1');

      try {
        await use(pool);
      } finally {
        await pool.end();
      }
    },
    { scope: 'worker' },
  ],
});

export { expect };

export async function resetMutableBookingState(db: Pool) {
  await db.query(`
    truncate table
      notification.notification_deliveries,
      notification.in_app_notifications,
      base.booking_otp_challenges,
      booking.appointment_services,
      booking.appointment_session_services,
      booking.appointments,
      booking.appointment_sessions
    restart identity cascade
  `);
}

export async function seedBookingFixture(db: Pool) {
  await db.query(`
    begin;

    insert into base.users (id, given_name, family_name, email, provider, email_verified_at)
    values (1, 'E2E', 'Behandler', 'provider@booking.e2e.invalid', 'LOCAL', now());

    insert into base.companies (id, org_num, name)
    values (1, '927491745', 'Fredrikstad Barbershop Bahar');

    insert into base.company_profiles (id, company_id, display_name)
    values (1, 1, 'Fredrikstad Barbershop Bahar');

    insert into base.company_products (id, company_id, product)
    values (1, 1, 'BOOKING');

    insert into base.company_roles (id, company_id, user_id, role_name)
    values (1, 1, 1, 'ADMIN');

    insert into booking.service_groups (id, company_id, name)
    values
      (1, 1, 'Klipp'),
      (2, 1, 'Styling'),
      (3, 1, 'Skjegg');

    insert into booking.services (id, company_id, service_group_id, name, price, duration)
    values
      (1, 1, 1, 'Hårklipp', 450, 20),
      (2, 1, 2, 'Vask og styling', 350, 20),
      (3, 1, 3, 'Skjeggtrim', 300, 20),
      (4, 1, 1, 'Maskinklipp', 250, 20);

    insert into booking.booking_profiles (id, user_id, company_id, description, created_at, updated_at)
    values (1, 1, 1, 'E2E booking provider', now(), now());

    insert into booking.booking_profile_services (id, profile_id, service_id, created_at, updated_at)
    values
      (1, 1, 1, now(), now()),
      (2, 1, 2, now(), now()),
      (3, 1, 3, now(), now()),
      (4, 1, 4, now(), now());

    insert into booking.daily_schedules (id, profile_id, day_of_week, start_time, end_time)
    values
      (1, 1, 'MONDAY', '08:00', '18:00'),
      (2, 1, 'TUESDAY', '08:00', '18:00'),
      (3, 1, 'WEDNESDAY', '08:00', '18:00'),
      (4, 1, 'THURSDAY', '08:00', '18:00'),
      (5, 1, 'FRIDAY', '08:00', '18:00'),
      (6, 1, 'SATURDAY', '08:00', '16:00');

    select setval(pg_get_serial_sequence('base.users', 'id'), 1, true);
    select setval(pg_get_serial_sequence('base.companies', 'id'), 1, true);
    select setval(pg_get_serial_sequence('base.company_profiles', 'id'), 1, true);
    select setval(pg_get_serial_sequence('base.company_products', 'id'), 1, true);
    select setval(pg_get_serial_sequence('base.company_roles', 'id'), 1, true);
    select setval(pg_get_serial_sequence('booking.service_groups', 'id'), 3, true);
    select setval(pg_get_serial_sequence('booking.services', 'id'), 4, true);
    select setval(pg_get_serial_sequence('booking.booking_profiles', 'id'), 1, true);
    select setval(pg_get_serial_sequence('booking.booking_profile_services', 'id'), 4, true);
    select setval(pg_get_serial_sequence('booking.daily_schedules', 'id'), 6, true);

    -- Company 2 has two providers, so it shows the employee step instead of auto-selecting.
    insert into base.users (id, given_name, family_name, email, provider, email_verified_at)
    values
      (2, 'Anna', 'Klipper', 'anna@booking.e2e.invalid', 'LOCAL', now()),
      (3, 'Bjørn', 'Barberer', 'bjorn@booking.e2e.invalid', 'LOCAL', now());

    insert into base.companies (id, org_num, name)
    values (2, '927491746', 'Nordre Frisør');

    insert into base.company_profiles (id, company_id, display_name)
    values (2, 2, 'Nordre Frisør');

    insert into base.company_products (id, company_id, product)
    values (2, 2, 'BOOKING');

    insert into base.company_roles (id, company_id, user_id, role_name)
    values (2, 2, 2, 'ADMIN'), (3, 2, 3, 'ADMIN');

    insert into booking.service_groups (id, company_id, name)
    values (4, 2, 'Klipp');

    insert into booking.services (id, company_id, service_group_id, name, price, duration)
    values (5, 2, 4, 'Herreklipp', 400, 20);

    insert into booking.booking_profiles (id, user_id, company_id, description, created_at, updated_at)
    values (2, 2, 2, 'Anna', now(), now()), (3, 3, 2, 'Bjørn', now(), now());

    insert into booking.booking_profile_services (id, profile_id, service_id, created_at, updated_at)
    values (5, 2, 5, now(), now()), (6, 3, 5, now(), now());

    -- Both providers keep the same opening hours as company 1.
    insert into booking.daily_schedules (profile_id, day_of_week, start_time, end_time)
    select new_profile.id, template.day_of_week, template.start_time, template.end_time
    from booking.daily_schedules template
    cross join (values (2), (3)) as new_profile(id)
    where template.profile_id = 1;

    select setval(pg_get_serial_sequence('base.users', 'id'), 3, true);
    select setval(pg_get_serial_sequence('base.companies', 'id'), 2, true);
    select setval(pg_get_serial_sequence('base.company_profiles', 'id'), 2, true);
    select setval(pg_get_serial_sequence('base.company_products', 'id'), 2, true);
    select setval(pg_get_serial_sequence('base.company_roles', 'id'), 3, true);
    select setval(pg_get_serial_sequence('booking.service_groups', 'id'), 4, true);
    select setval(pg_get_serial_sequence('booking.services', 'id'), 5, true);
    select setval(pg_get_serial_sequence('booking.booking_profiles', 'id'), 3, true);
    select setval(pg_get_serial_sequence('booking.booking_profile_services', 'id'), 6, true);

    commit;
  `);
}
