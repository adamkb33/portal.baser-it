# Technologies Used

## Core Framework & Runtime

### React Router v7
- **Full-stack React framework** with server-side rendering (SSR) enabled
- **File-based routing** with custom route builder system
- **Type-safe loaders and actions** for data fetching
- **Built-in form handling** and validation

### React 19
- Latest React version with concurrent features
- Server components support
- Enhanced hooks and performance optimizations

### TypeScript
- Strict type checking enabled
- Full type safety across the entire application
- Generated types from OpenAPI specifications

## Styling & UI

### TailwindCSS v4
- Utility-first CSS framework
- Custom design tokens and theming
- Responsive design patterns

### Radix UI
- Headless, accessible component primitives:
  - `@radix-ui/react-dialog` - Modal dialogs
  - `@radix-ui/react-dropdown-menu` - Dropdown menus
  - `@radix-ui/react-select` - Select components
  - `@radix-ui/react-tabs` - Tab interfaces
  - `@radix-ui/react-checkbox` - Checkbox inputs
  - `@radix-ui/react-popover` - Popover components

### Lucide React
- Consistent icon library
- Tree-shakable SVG icons
- Used throughout the UI (Check, MapPin, etc.)

### Additional UI Libraries
- **Sonner** - Toast notifications
- **Embla Carousel** - Carousel/slider components
- **React Day Picker** - Date picker components
- **Class Variance Authority (CVA)** - Component variant management
- **clsx & tailwind-merge** - Conditional styling utilities

## Data Management & Forms

### React Hook Form
- Performant form handling with minimal re-renders
- Integrated with Zod for validation
- `@hookform/resolvers` for validation resolver

### Zod
- Runtime type validation
- Schema-first form validation
- API response validation

### TanStack Table
- Powerful data table components
- Built-in sorting, filtering, and pagination
- Type-safe column definitions

## API & Data Fetching

### Axios
- HTTP client for API requests
- Request/response interceptors
- Error handling and retries

### OpenAPI Code Generation
- **openapi-typescript-codegen** - Generates TypeScript types and API clients
- Automated type safety from backend API specifications
- Located in `tmp/openapi/gen/` directories

## Development Tools

### Vite
- Fast build tool and dev server
- Hot module replacement (HMR)
- TypeScript compilation

### Vitest
- Unit testing framework
- Native TypeScript support
- Fast test execution

### TypeScript Configuration
- Strict type checking
- Path mapping with `vite-tsconfig-paths`
- React Router type generation

### Code Quality
- **Prettier** - Code formatting
- **ESLint** (implied) - Code linting
- **TypeScript compiler** - Static analysis

## Utilities & Helpers

### Date Handling
- **date-fns** - Modern date utility library
- Custom Norwegian localization utilities
- Date formatting for appointments

### Theming
- **next-themes** - Theme switching (dark/light mode)
- System preference detection

### Additional Utilities
- **isbot** - Bot detection
- **dotenv** - Environment variable management
- **tsx** - TypeScript execution for scripts

## Build & Deployment

### React Router Serve
- Production server for built applications
- `@react-router/serve` - Server runtime
- `@react-router/node` - Node.js adapter

### Docker
- Containerization support
- `.dockerignore` for optimized builds
- Production-ready deployment

## Development Scripts

```json
{
  "dev": "npx kill-port 5173 && react-router dev",
  "build": "react-router build",
  "start": "react-router-serve ./build/server/index.js",
  "test": "vitest",
  "typecheck": "react-router typegen && tsc",
  "gen:api": "tsx scripts/openapi/generate.ts"
}
```

## Architecture Patterns

### Feature-Based Organization
- Modular architecture with feature folders
- Co-located related functionality
- Clear separation of concerns

### Type-Safe API Integration
- Generated API clients from OpenAPI specs
- Runtime validation with Zod schemas
- Consistent error handling patterns

### Server-Side Rendering (SSR)
- Improved SEO and performance
- Universal data fetching patterns
- Hydration-friendly component structure