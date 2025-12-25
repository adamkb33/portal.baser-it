/* =============================================================================
   BOTTOM NAVIGATION WITH DRILLDOWN DRAWER
   =============================================================================
   
   A mobile-first navigation component that combines a fixed bottom navigation bar
   with a hierarchical drilldown drawer for nested navigation structures.
   
   ARCHITECTURE:
   ─────────────────────────────────────────────────────────────────────────────
   1. Bottom Bar (Fixed)
      - Shows top-level navigation items (parents)
      - Horizontally scrollable if more than ~4 items
      - Icons + labels with active state highlighting
      - Child count badges show total descendants
      
   2. Bottom Sheet Drawer (Modal)
      - Opens when parent item with children is clicked
      - Displays children of selected parent
      - Supports infinite nesting via drilldown pattern
      - Breadcrumb trail shows navigation path
      
   NAVIGATION FLOW:
   ─────────────────────────────────────────────────────────────────────────────
   User taps parent item (e.g., "Mitt selskap")
     ↓
   Bottom sheet slides up from bottom
     ↓
   Sheet shows children of parent (e.g., "Selskap administrasjon", "Booking")
     ↓
   User taps child with children (e.g., "Booking")
     ↓
   Sheet drills down → replaces content with grandchildren
     ↓
   Breadcrumb shows: "Mitt selskap > Booking"
     ↓
   Back button available to return to parent level
     ↓
   Process repeats for infinite depth
   
   GAMIFICATION FEATURES:
   ─────────────────────────────────────────────────────────────────────────────
   - Progress bar: Visual indicator of active section
   - Level badges: Numbered markers (#1, #2, #3...) on parent items
   - Child count badges: Shows total descendant count per item
   - Breadcrumb trail: Navigation path visualization
   - Item counters: "Level 2 • 5 items", "12 undersider"
   - Expand indicators: Chevron icons show expandable items
   
   STATE MANAGEMENT:
   ─────────────────────────────────────────────────────────────────────────────
   - sheetOpen: Boolean controlling drawer visibility
   - selectedParent: Currently selected parent item (root of drawer)
   - drilldownStack: Array tracking navigation hierarchy path
     Example: [parent, child, grandchild] = 3 levels deep
   
   INTERACTION PATTERNS:
   ─────────────────────────────────────────────────────────────────────────────
   - Click parent with children → Opens drawer (prevents navigation)
   - Click parent without children → Navigates directly
   - Click child with children → Drills down deeper
   - Click child without children → Navigates and closes drawer
   - Click backdrop → Closes drawer
   - Click X button → Closes drawer
   - Click back button → Goes up one level
   
   DESIGN SYSTEM COMPLIANCE:
   ─────────────────────────────────────────────────────────────────────────────
   - Brutalist black/white/purple theme
   - Sharp corners (rounded-none)
   - 2px borders everywhere (border-border)
   - Material Design bottom nav specs (56-64px height, 24px icons)
   - Thumb-friendly zones (bottom placement)
   - ARIA labels and semantic HTML
   
   RESPONSIVE BEHAVIOR:
   ─────────────────────────────────────────────────────────────────────────────
   - Bottom bar: Horizontal scroll on overflow
   - Sheet drawer: Max height 80vh to prevent full-screen takeover
   - Breadcrumbs: Horizontal scroll on overflow
   - Children list: Vertical scroll on overflow
   
   ========================================================================== */

import { Link, useLocation } from 'react-router';
import { type RouteBranch } from '~/lib/route-tree';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useState } from 'react';

type BottomNavProps = {
  branches: RouteBranch[];
};

export function BottomNav({ branches }: BottomNavProps) {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<RouteBranch | null>(null);
  const [drilldownStack, setDrilldownStack] = useState<RouteBranch[]>([]);

  const navItems = branches.filter((item) => item.label && !item.hidden);

  const handleParentClick = (item: RouteBranch, e: React.MouseEvent) => {
    if (item.children && item.children.length > 0) {
      e.preventDefault();
      setSelectedParent(item);
      setDrilldownStack([item]);
      setSheetOpen(true);
    }
  };

  const handleChildClick = (child: RouteBranch, e: React.MouseEvent) => {
    if (child.children && child.children.length > 0) {
      e.preventDefault();
      setDrilldownStack([...drilldownStack, child]);
    } else {
      setSheetOpen(false);
      setDrilldownStack([]);
    }
  };

  const handleBack = () => {
    const newStack = [...drilldownStack];
    newStack.pop();
    setDrilldownStack(newStack);
    if (newStack.length === 0) {
      setSheetOpen(false);
      setSelectedParent(null);
    }
  };

  const currentLevel = drilldownStack[drilldownStack.length - 1];
  const currentChildren = currentLevel?.children?.filter((c) => c.label && !c.hidden) || [];

  const countAllDescendants = (item: RouteBranch): number => {
    if (!item.children) return 0;
    return item.children.reduce((acc, child) => {
      return acc + 1 + countAllDescendants(child);
    }, 0);
  };

  if (navItems.length === 0) return null;

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav aria-label="Hovednavigasjon" className="fixed bottom-0 left-0 right-0 z-50 bg-background">
        {/* Progress bar */}
        <div className="relative h-1 bg-muted">
          <div
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
            style={{
              width: `${(navItems.filter((item) => location.pathname.startsWith(item.href)).length / navItems.length) * 100}%`,
            }}
          />
        </div>

        <div className="border-t-2 border-border">
          <ul className="flex items-stretch overflow-x-auto scrollbar-hide" role="list">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const hasIcon = Icon && typeof Icon === 'function';
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              const childCount = countAllDescendants(item);

              return (
                <li key={item.id} className="flex-shrink-0">
                  <Link
                    to={item.href}
                    onClick={(e) => handleParentClick(item, e)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      relative flex flex-col items-center justify-center gap-1 py-3 px-4
                      min-h-[64px] min-w-[80px] transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-ring
                      ${
                        isActive
                          ? 'bg-foreground text-background'
                          : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                    `}
                  >
                    {/* Level badge */}
                    <span className="absolute top-1 left-2 text-[0.5rem] font-bold opacity-50">#{index + 1}</span>

                    {/* Icon with child badge */}
                    {hasIcon && Icon && (
                      <div className="relative">
                        <Icon
                          className={`transition-all ${isActive ? 'w-7 h-7' : 'w-6 h-6'}`}
                          strokeWidth={isActive ? 2.5 : 2}
                          aria-hidden="true"
                        />
                        {childCount > 0 && (
                          <span
                            className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[0.5rem] font-bold border ${
                              isActive
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-foreground text-background border-foreground'
                            }`}
                          >
                            {childCount}
                          </span>
                        )}
                      </div>
                    )}

                    <span
                      className={`text-[0.6rem] uppercase tracking-[0.05em] leading-tight text-center whitespace-nowrap ${
                        isActive ? 'font-bold' : 'font-medium'
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* Expand indicator */}
                    {childCount > 0 && <ChevronRight className="absolute bottom-1 right-1 w-3 h-3 opacity-50" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Bottom Sheet Drawer */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-foreground/50 z-[60] animate-in fade-in duration-200"
            onClick={() => {
              setSheetOpen(false);
              setDrilldownStack([]);
            }}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-background border-t-4 border-primary animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-border bg-muted">
              <div className="flex items-center gap-2">
                {drilldownStack.length > 1 && (
                  <button
                    onClick={handleBack}
                    className="border-2 border-foreground bg-background text-foreground p-2 hover:bg-foreground hover:text-background transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.08em]">{currentLevel?.label}</h2>
                  <p className="text-[0.65rem] text-muted-foreground">
                    Level {drilldownStack.length} • {currentChildren.length} items
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSheetOpen(false);
                  setDrilldownStack([]);
                }}
                className="border-2 border-foreground bg-background text-foreground p-2 hover:bg-destructive hover:border-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Breadcrumb trail */}
            {drilldownStack.length > 1 && (
              <div className="px-4 py-2 border-b border-border bg-muted/50">
                <div className="flex items-center gap-1 text-[0.65rem] text-muted-foreground overflow-x-auto">
                  {drilldownStack.map((level, idx) => (
                    <div key={level.id} className="flex items-center gap-1 flex-shrink-0">
                      <span className="font-medium">{level.label}</span>
                      {idx < drilldownStack.length - 1 && <ChevronRight className="w-3 h-3" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Children list */}
            <ul className="flex-1 overflow-y-auto divide-y divide-border" role="list">
              {currentChildren.map((child) => {
                const ChildIcon = child.icon;
                const hasChildIcon = ChildIcon && typeof ChildIcon === 'function';
                const isChildActive =
                  location.pathname === child.href || location.pathname.startsWith(child.href + '/');
                const grandchildCount = countAllDescendants(child);

                return (
                  <li key={child.id}>
                    <Link
                      to={child.href}
                      onClick={(e) => handleChildClick(child, e)}
                      className={`flex items-center justify-between p-4 hover:bg-muted transition-colors ${
                        isChildActive ? 'bg-primary/10 border-l-4 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {hasChildIcon && ChildIcon && <ChildIcon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />}
                        <div>
                          <p className={`text-sm ${isChildActive ? 'font-bold' : 'font-medium'}`}>{child.label}</p>
                          {grandchildCount > 0 && (
                            <p className="text-[0.65rem] text-muted-foreground mt-0.5">{grandchildCount} undersider</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {grandchildCount > 0 && (
                          <span className="border border-foreground bg-background px-2 py-0.5 text-[0.6rem] font-bold">
                            {grandchildCount}
                          </span>
                        )}
                        {grandchildCount > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
