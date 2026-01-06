import { Button } from '~/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function RootPageHeroMinimalist() {
  return (
    <section className="relative lg:col-span-12 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-8">
            <h1 className="text-6xl lg:text-8xl font-bold text-foreground leading-none">
              Bedriftens <br />
              <span className="text-primary">admin-system</span>
            </h1>

            <p className="text-2xl text-muted-foreground max-w-2xl">
              Booking. Fakturering. Rapportering. Alt på ett sted.
            </p>

            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8">
              Start gratis prøveperiode
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-[300px] rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&auto=format&fit=crop"
                alt="Team"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="h-[300px] rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&auto=format&fit=crop"
                alt="Office"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
