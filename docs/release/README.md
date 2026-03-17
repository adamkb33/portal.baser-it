# Frontend Release Docs

## Purpose

This folder contains the frontend production-readiness roadmap for the project. The goal is to move the frontend to a launch-ready standard without reintroducing design drift, route-owned presentation systems, or fragile runtime behavior.

This release track currently excludes:

- performance optimization
- deployment and release-operations work

Those should be handled later as separate workstreams.

## Principles

- Shared UI belongs in `app/ui`
- Routes compose templates and shared components
- Route-owned design systems are not acceptable
- Token usage should remain consistent across all surfaces
- Critical launch flows matter more than isolated component polish

## Documents

- [01-product-critical-ux.md](/Users/adambaser/Documents/portal.pitell/docs/release/01-product-critical-ux.md)
- [01a-product-critical-ux-audit.md](/Users/adambaser/Documents/portal.pitell/docs/release/01a-product-critical-ux-audit.md)
- [0.01B-form-dialog-to-route-refactor.md](/Users/adambaser/Documents/portal.pitell/docs/release/0.01B-form-dialog-to-route-refactor.md)
- [02-engineering-quality.md](/Users/adambaser/Documents/portal.pitell/docs/release/02-engineering-quality.md)
- [03-runtime-reliability.md](/Users/adambaser/Documents/portal.pitell/docs/release/03-runtime-reliability.md)
- [04-design-system-maturity.md](/Users/adambaser/Documents/portal.pitell/docs/release/04-design-system-maturity.md)
- [05-launch-checklist.md](/Users/adambaser/Documents/portal.pitell/docs/release/05-launch-checklist.md)
- [06-embedded-booking-roadmap.md](/Users/adambaser/Documents/portal.pitell/docs/release/06-embedded-booking-roadmap.md)

## Priority Order

1. Runtime reliability for critical routes
2. Product-critical UX for launch journeys
3. Engineering quality around shared UI boundaries
4. Design system maturity and codification

## Immediate Next Actions

1. Create a route inventory for all launch-relevant routes.
2. Label each route by template status, legacy UI usage, missing states, and reliability risk.
3. Convert the launch checklist into tracked execution items with status markers.
