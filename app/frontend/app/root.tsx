import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { Toaster } from "sonner";

import type { Route } from "./+types/root";
import { GridBackground } from "./components/visual/background/GridBackground";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg?v=3" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png?v=3" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png?v=3" },
  { rel: "shortcut icon", href: "/favicon.ico?v=3" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png?v=3" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Martian+Mono:wght@300;400;500;600;700;800&family=Onest:wght@300;400;500;600;700;800;900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
        />
        <meta name="theme-color" content="#08090a" />
        <meta name="color-scheme" content="dark" />
        <meta
          name="description"
          content="LiftStats — Statistical Strength Benchmarking, Biomechanical Archetypes, and ML Progression Forecasting based on 1.55M+ OpenPowerlifting records."
        />
        <meta property="og:site_name" content="LiftStats" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="LiftStats | Statistical Strength Benchmarking & ML Forecasting" />
        <meta property="og:description" content="Where do your squat, bench, and deadlift really rank? Instant, statistically grounded percentile benchmarking against 1.55M+ real OpenPowerlifting competition attempts." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="LiftStats — Statistical Strength Benchmarking and Progression Forecasting" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LiftStats | Statistical Strength Benchmarking & ML Forecasting" />
        <meta name="twitter:description" content="Where do your squat, bench, and deadlift really rank? Instant, statistically grounded percentile benchmarking against 1.55M+ real OpenPowerlifting competition attempts." />
        <meta name="twitter:image" content="/og-image.png" />
        <title>LiftStats | Powerlifting Percentile Benchmarking</title>
        <Meta />
        <Links />
      </head>
      <body className="bg-[var(--color-iron-950)] text-[var(--color-chalk-white)] antialiased min-h-[100dvh] flex flex-col selection:bg-white/20 selection:text-white relative">
        {/* Dynamic 3D Undulating WebGL Grid Background */}
        <div className="grid-background-host" aria-hidden="true">
          <GridBackground interactive={true} calm={true} />
        </div>

        {/* Accessible skip link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:font-mono focus:text-xs focus:font-bold focus:rounded-lg focus:shadow-xl focus:outline-none"
        >
          Skip to main content
        </a>
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#101216",
              border: "1px solid #282c35",
              color: "#f4f4f6",
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "System Exception";
  let details = "An unexpected error occurred while processing lift stats.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404 - Not Found" : "Error";
    details =
      error.status === 404
        ? "The requested analytical view could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-iron-950)] text-[var(--color-chalk-white)] font-sans">
      <div className="max-w-md w-full p-6 rounded-xl border border-[var(--color-steel-border)] bg-[var(--color-iron-900)]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-chalk-muted)]">
            LiftStats Fault
          </span>
        </div>
        <h1 className="text-xl font-bold font-mono tracking-tight text-white mb-2">{message}</h1>
        <p className="text-sm text-[var(--color-chalk-muted)] mb-4">{details}</p>
        {stack && (
          <pre className="w-full p-3 rounded bg-black/60 font-mono text-xs text-red-400 overflow-x-auto mb-4 border border-red-950">
            <code>{stack}</code>
          </pre>
        )}
        <a
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-mono text-xs tracking-wider uppercase transition-all"
        >
          Return to Dashboard
        </a>
      </div>
    </main>
  );
}
