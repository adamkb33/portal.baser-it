// app/routes/appointments.$companyId.tsx
import {
  createCookie,
  data,
  redirect,
  type LoaderFunctionArgs,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
} from 'react-router';
import type { AppointmentSessionDto } from '~/api/clients/booking';
import { bookingApi } from '~/lib/utils';
import { Accordion } from '~/components/ui/accordion';
import { BiTBusinessHero } from '~/components/heros/BiT-business.hero';
import { ShapesAngularOne } from '~/components/shapes/shapes';

export const appointmentSessionCookie = createCookie('appointment_session', {
  httpOnly: true,
  sameSite: 'lax',
  secure: true,
  path: '/',
});

const STEPS = [
  { key: 'contact', path: '/contact-form' },
  { key: 'services', path: '/contact-form/services' },
  { key: 'employee', path: '/contact-form/services/employee' },
  { key: 'time', path: '/contact-form/services/employee/time' },
  { key: 'overview', path: '/contact-form/services/employee/time/overview' },
] as const;

type Step = (typeof STEPS)[number];
type StepKey = Step['key'];
type StepIndex = 0 | 1 | 2 | 3 | 4;

type LoaderData = {
  companyId: number;
  session: AppointmentSessionDto;
  nextStepIndex: StepIndex;
  currentStepKey: StepKey | null;
};

export type AppointmentsOutletContext = {
  companyId: number;
  session: AppointmentSessionDto;
};

function getNextStepIndex(session: AppointmentSessionDto): StepIndex {
  const hasContact = session.contactId != null;
  const hasServices = Array.isArray(session.selectedServices) && session.selectedServices.length > 0;
  const hasEmployee = session.selectedUserId != null;
  const hasTime = session.selectedStartTime != null;

  if (!hasContact) return 0;
  if (!hasServices) return 1;
  if (!hasEmployee) return 2;
  if (!hasTime) return 3;
  return 4;
}

function normalizeRelative(pathname: string, basePath: string): string {
  const raw = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;

  if (raw === '') return '';

  let normalized = raw.startsWith('/') ? raw : `/${raw}`;
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.replace(/\/+$/, '');
  }
  return normalized;
}

function getStepIndexFromRelative(relative: string): StepIndex | null {
  const idx = STEPS.findIndex((s) => s.path === relative);
  return idx === -1 ? null : (idx as StepIndex);
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const companyIdParam = params.companyId;
  const companyId = Number(companyIdParam);

  if (!companyIdParam || Number.isNaN(companyId)) {
    return redirect('/');
  }

  const url = new URL(request.url);
  const pathname = url.pathname;
  const basePath = `/appointments/${companyId}`;

  const cookieHeader = request.headers.get('Cookie');
  const existingSessionId = (await appointmentSessionCookie.parse(cookieHeader)) ?? null;

  let session: AppointmentSessionDto;
  try {
    session =
      await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getOrCreateAppointmentSession(
        {
          companyId,
          sessionId: existingSessionId ?? undefined,
        },
      );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return redirect('/');
  }

  const setCookieHeader = await appointmentSessionCookie.serialize(session.sessionId);

  const nextStepIndex = getNextStepIndex(session);
  const nextStepPath = basePath + STEPS[nextStepIndex].path;

  const relative = normalizeRelative(pathname, basePath);
  let currentStepKey: StepKey | null = null;

  if (relative === '') {
    if (pathname !== nextStepPath) {
      return redirect(nextStepPath, {
        headers: {
          'Set-Cookie': setCookieHeader,
        },
      });
    }
  } else {
    const currentIndex = getStepIndexFromRelative(relative);
    if (currentIndex !== null) {
      currentStepKey = STEPS[currentIndex].key;
      if (currentIndex > nextStepIndex) {
        return redirect(nextStepPath, {
          headers: {
            'Set-Cookie': setCookieHeader,
          },
        });
      }
    }
    // unknown nested route → allowed
  }

  return data<LoaderData>(
    {
      companyId,
      session,
      nextStepIndex,
      currentStepKey,
    },
    {
      headers: {
        'Set-Cookie': setCookieHeader,
      },
    },
  );
}

export default function AppointmentsLayout() {
  const { companyId, session, nextStepIndex, currentStepKey } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey: StepKey = currentStepKey ?? STEPS[nextStepIndex].key;

  const handleAccordionChange = (value: string | undefined) => {
    if (!value) return;
    const step = STEPS.find((s) => s.key === value);
    if (!step) return;

    const basePath = `/appointments/${companyId}`;
    const targetPath = basePath + step.path;
    if (targetPath === location.pathname) return;

    navigate(targetPath);
  };

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="flex-2 space-y-6">
        <div className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 px-6 py-6 shadow-[0_20px_50px_rgba(99,102,241,0.12)] backdrop-blur-sm sm:px-8 sm:py-7">
          <ShapesAngularOne />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Book Time</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Oppgi kontaktopplysninger, velg tjenester, velg ansatt og tidspunkt.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
              <div className="text-sm font-semibold text-indigo-600">
                Steg {nextStepIndex + 1} av {STEPS.length}
              </div>
            </div>
          </div>
        </div>

        <Accordion
          type="single"
          value={activeKey}
          onValueChange={handleAccordionChange}
          className="space-y-3"
          collapsible
        >
          {/* Each step route renders its own AccordionItem with matching value */}
          <Outlet context={{ companyId, session }} />
        </Accordion>
      </div>

      <div className="flex-1">
        <BiTBusinessHero />
      </div>
    </div>
  );
}
