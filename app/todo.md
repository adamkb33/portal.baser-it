# TODO

## Current Priorities

1. ✅ Remove all remaining usages of the shadcn/ChatCN calendar component and reuse our in-house `Calendar` component everywhere.
2. ✅ Make the calendar view mobile compatible (layout, interactions, and readability on small screens).
3. ✅ Move the unavailability route up to `company/booking` so it is no longer nested under booking profile.
4. ✅ Update the sidebar menu UX/UI and define what “better” means before implementation (requirements pass first).
5. ✅ Replace nav menu button icons to use our own icon/button component patterns.
6. ✅ Create a new nav button variant optimized for icon usage and improved visual consistency.
7. ✅ Audit the codebase for any remaining shadcn/ChatCN components and create a mapped inventory.
8. ✅ fix the kalendar view for adding unavaliblities and shit, pre selected wit hthe unavalibilty with redirectx
9. Make booking flow take inn multiple service ids so people can book more than one
10. Create blueprint for creating pages

## Notes

- Always run `npm run typecheck` after changes.

## Existing Items (Untriaged)

- Remove breaks from timesheet; default to 30 min if registration is more than 5 hours.
- Vakt lister.
- Remove all metrics; make them clickable and expandable (information overload).
