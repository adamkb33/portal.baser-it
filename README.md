# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Booking Embed Implementation

The public booking flow can be embedded on a client marketing site with a raw iframe. The iframe should not scroll internally; the parent page should own scrolling. To make that work, the embedded booking route posts resize and step-change messages to the parent page, and the parent page updates the iframe height.

Recommended snippet:

```html
<iframe
  id="pitell-booking"
  src="https://YOUR_PORTAL_DOMAIN/embed?companyId=123&theme=fredrikstad-barbershop"
  title="Bestill time"
  scrolling="no"
  style="display: block; width: 100%; height: 720px; border: 0; overflow: hidden"
></iframe>

<script>
  const bookingFrame = document.getElementById('pitell-booking');
  const bookingOrigin = 'https://YOUR_PORTAL_DOMAIN';

  window.addEventListener('message', (event) => {
    if (event.origin !== bookingOrigin) return;
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.type === 'embed:resize' && Number.isFinite(event.data.height)) {
      bookingFrame.style.height = `${Math.max(320, event.data.height)}px`;
    }

    if (event.data.type === 'embed:step-changed') {
      bookingFrame.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
</script>
```

The raw iframe alone cannot resize itself because browser security prevents iframe content from changing the parent DOM directly. The parent-page listener is required for the no-double-scroll behavior.

The `/embed` entry URL validates the selected theme once, stores it in a short-lived `embed_config` cookie scoped to `/embed`, and redirects into the embedded booking flow. Child booking routes do not need to keep `theme=...` in the URL.

Supported query parameters:

| Parameter   | Required | Description                                                                                           |
| ----------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `companyId` | Yes      | Numeric id for the booking-ready company.                                                             |
| `theme`     | No       | Built-in embed theme, for example `fredrikstad-barbershop`, `pitell`, `ocean`, `sunset`, or `forest`. |
| `reset`     | No       | Use `reset=1` to clear the current appointment session before starting.                               |

See [docs/booking-embed-integration.md](docs/booking-embed-integration.md) for the full integration contract.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
