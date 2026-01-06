import { Button } from '~/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

export default function RootPageHero() {
  return (
    <section className="relative lg:col-span-12 p-4">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
            Bedriftenes svar på <span className="text-primary">administrative systemer</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl">
            Effektiviser booking, timeplanlegging og kundeadministrasjon på ett sted. Spar tid, reduser feil, og fokuser
            på det som virkelig betyr noe.
          </p>

          <ul className="space-y-2">
            {['Automatisk booking 24/7', 'Integrert fakturering og rapportering', 'Mobilapp for ansatte og kunder'].map(
              (benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-foreground">
                  <svg className="h-5 w-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {benefit}
                </li>
              ),
            )}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Ta kontakt med salg
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button size="lg" variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Se demo
            </Button>
          </div>
        </div>

        <div className="relative h-[400px] lg:h-[500px]">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop"
            alt="Team collaborating on business solutions"
            className="h-full w-full object-cover rounded-lg"
          />
        </div>
      </div>
    </section>
  );
}
