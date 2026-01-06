import { Button } from '~/components/ui/button';
import { ArrowRight, Calendar, FileText, Smartphone } from 'lucide-react';

export default function RootPageHeroWithSplitFeature() {
  return (
    <section className="relative lg:col-span-12 p-4">
      <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-block text-sm font-semibold text-primary uppercase tracking-wide">
              Alt-i-ett løsning
            </div>
            <h1 className="text-5xl font-bold text-foreground lg:text-6xl leading-tight">
              Administrer bedriften din <span className="text-primary">smart og enkelt</span>
            </h1>
          </div>

          <p className="text-lg text-muted-foreground">
            Et komplett system for booking, fakturering og kundeadministrasjon. Spar timer hver uke på automatisering.
          </p>

          <div className="space-y-4">
            {[
              { icon: Calendar, text: 'Automatisk booking og timeplanlegging' },
              { icon: FileText, text: 'Integrert fakturering og rapportering' },
              { icon: Smartphone, text: 'Mobilapp for ansatte og kunder' },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-foreground pt-2">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Ta kontakt med salg
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              Se demo
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-primary/5 rounded-lg transform rotate-3"></div>
          <div className="relative h-[500px] rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop"
              alt="Team collaboration"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
