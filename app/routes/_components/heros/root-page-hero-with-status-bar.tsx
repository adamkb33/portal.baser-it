import { Button } from '~/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

export default function RootPageHeroWithStatusBar() {
  return (
    <section className="relative lg:col-span-12 p-4">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-foreground lg:text-7xl">
            Styr din bedrift med <span className="text-primary">ett system</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Booking, timeplanlegging, fakturering og rapportering – alt du trenger for å effektivisere driften.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Start gratis i dag
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Se demo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 py-8 border-y border-border">
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground">500+</div>
            <div className="text-sm text-muted-foreground">Bedrifter</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground">24/7</div>
            <div className="text-sm text-muted-foreground">Support</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground">99.9%</div>
            <div className="text-sm text-muted-foreground">Oppetid</div>
          </div>
        </div>

        <div className="relative h-[400px] rounded-lg overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&auto=format&fit=crop"
            alt="Dashboard preview"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
