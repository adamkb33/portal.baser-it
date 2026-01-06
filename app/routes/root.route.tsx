import { useState } from 'react';
import { Button } from '~/components/ui/button';
import RootPageHeroMinimalist from './_components/heros/root-page-hero-minimalist';
import RootPageHeroWithSplitFeature from './_components/heros/root-page-hero-with-split-feature';
import RootPageHeroWithStatusBar from './_components/heros/root-page-hero-with-status-bar';
import RootPageHero from './_components/heros/root-page.hero';

export default function RootRoute() {
  const variants = [
    { id: 1, name: 'Original', Component: RootPageHero },
    { id: 2, name: 'Minimalist', Component: RootPageHeroMinimalist },
    { id: 3, name: 'Split Feature', Component: RootPageHeroWithSplitFeature },
    { id: 4, name: 'Status Bar', Component: RootPageHeroWithStatusBar },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const HeroComponent = variants[currentIndex].Component;

  return (
    <div>
      <HeroComponent />

      {/* Variant switcher */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-card border border-border rounded-lg p-2 shadow-lg">
        {variants.map((variant, index) => (
          <Button
            key={variant.id}
            onClick={() => setCurrentIndex(index)}
            variant={currentIndex === index ? 'default' : 'outline'}
            size="sm"
          >
            {variant.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
