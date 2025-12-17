import {
  ArrowLeft,
  ArrowRight,
  Book,
  FileCode,
  Layers,
  LifeBuoy,
  Puzzle,
  Terminal,
} from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between  max-w-[1200px] m-auto">
          <div className="flex items-center gap-2">
            <Puzzle className="h-6 w-6 text-purple" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-teal-500 bg-clip-text text-transparent">
              Microfrontends Docs
            </span>
          </div>
          <div>
            <a href="/">
              <Button className="bg-purple-500 hover:bg-purple-500/90">
                Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40 p-6">
          <nav className="grid gap-4 text-sm">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Getting Started</h3>
              <ul className="grid gap-2">
                <li>
                  <Link
                    to="#introduction"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Book className="h-4 w-4" />
                    Introduction
                  </Link>
                </li>
                <li>
                  <Link
                    to="#installation"
                    className="flex items-center gap-2 text-purple font-medium"
                  >
                    <Terminal className="h-4 w-4" />
                    Installation
                  </Link>
                </li>
                <li>
                  <Link
                    to="#quick-start"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Layers className="h-4 w-4" />
                    Quick Start
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Core Concepts</h3>
              <ul className="grid gap-2">
                <li>
                  <Link
                    to="#architecture"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Layers className="h-4 w-4" />
                    Architecture
                  </Link>
                </li>
                <li>
                  <Link
                    to="#routing"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <FileCode className="h-4 w-4" />
                    Routing
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 md:p-10">
          <div className="mx-auto max-w-3xl space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground">
                Home
              </Link>
              <span>/</span>
              <Link to="/docs" className="hover:text-foreground">
                Documentation
              </Link>
              <span>/</span>
              <span className="text-foreground">Installation</span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Installation
              </h1>
              <p className="mt-2 text-muted-foreground">
                Learn how to install and set up Microfrontends in your project.
              </p>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <h2
                className="text-2xl font-semibold tracking-tight"
                id="prerequisites"
              >
                Prerequisites
              </h2>
              <p>
                Before you begin, make sure you have the following installed:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Node.js 16.0 or later</li>
                <li>npm 7.0 or later or Yarn 1.22 or later</li>
                <li>Basic knowledge of React and React Router</li>
              </ul>

              <h2
                className="text-2xl font-semibold tracking-tight pt-4"
                id="installation"
              >
                Installation
              </h2>
              <p>You can install Microfrontends using npm or yarn:</p>

              <div className="rounded-lg bg-muted p-4">
                <pre className="text-sm">
                  npm install @microfrontends/core @microfrontends/router
                </pre>
              </div>

              <div className="rounded-lg bg-muted p-4 mt-4">
                <pre className="text-sm">
                  yarn add @microfrontends/core @microfrontends/router
                </pre>
              </div>

              <h2
                className="text-2xl font-semibold tracking-tight pt-4"
                id="project-setup"
              >
                Project Setup
              </h2>
              <p>
                Microfrontends works best with a monorepo structure. We
                recommend using Turborepo or Nx for managing your microfrontend
                applications.
              </p>

              <div className="rounded-lg border border-purple/20 bg-purple/5 p-4 mt-6">
                <h3 className="text-lg font-medium text-purple">
                  Recommended Project Structure
                </h3>
                <pre className="mt-2 text-sm">
                  {`my-microfrontend-app/
├── apps/
│   ├── shell/             # Main application shell
│   ├── dashboard/         # Dashboard microfrontend
│   ├── profile/           # Profile microfrontend
│   └── settings/          # Settings microfrontend
├── packages/
│   ├── shared-ui/         # Shared UI components
│   └── shared-utils/      # Shared utilities
└── package.json           # Root package.json`}
                </pre>
              </div>

              <h2
                className="text-2xl font-semibold tracking-tight pt-6"
                id="configuration"
              >
                Configuration
              </h2>
              <p>
                Configure your microfrontends by creating a configuration file
                in your shell application:
              </p>

              <div className="rounded-lg bg-muted p-4 mt-4">
                <h3 className="text-sm font-medium mb-2">JavaScript</h3>
                <pre className="text-sm overflow-auto">
                  {`// apps/shell/src/config.js
import { createMicrofrontendsConfig } from '@microfrontends/core';

export const config = createMicrofrontendsConfig({
  apps: [
    {
      name: 'dashboard',
      entry: process.env.NODE_ENV === 'production'
        ? 'https://dashboard.example.com/remoteEntry.js'
        : 'http://localhost:3001/remoteEntry.js',
      route: '/dashboard/*',
    },
    {
      name: 'profile',
      entry: process.env.NODE_ENV === 'production'
        ? 'https://profile.example.com/remoteEntry.js'
        : 'http://localhost:3002/remoteEntry.js',
      route: '/profile/*',
    },
    {
      name: 'settings',
      entry: process.env.NODE_ENV === 'production'
        ? 'https://settings.example.com/remoteEntry.js'
        : 'http://localhost:3003/remoteEntry.js',
      route: '/settings/*',
    },
  ],
});`}
                </pre>
              </div>

              <h2
                className="text-2xl font-semibold tracking-tight pt-6"
                id="shell-setup"
              >
                Shell Application Setup
              </h2>
              <p>
                Set up your shell application to load and render microfrontends:
              </p>

              <div className="rounded-lg bg-muted p-4 mt-4">
                <pre className="text-sm overflow-auto">
                  {`// apps/shell/src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { MicrofrontendsProvider, MicrofrontendsRouter } from '@microfrontends/router';
import { config } from './config';

// Your shell components
import Header from './components/Header';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <BrowserRouter>
      <MicrofrontendsProvider config={config}>
        <div className="app-container">
          <Header />
          <div className="content-container">
            <Sidebar />
            <main className="main-content">
              <MicrofrontendsRouter />
            </main>
          </div>
        </div>
      </MicrofrontendsProvider>
    </BrowserRouter>
  );
}

export default App;`}
                </pre>
              </div>

              <h2
                className="text-2xl font-semibold tracking-tight pt-6"
                id="next-steps"
              >
                Next Steps
              </h2>
              <p>
                Now that you have installed and configured Microfrontends, you
                can:
              </p>

              <div className="grid gap-4 mt-4 md:grid-cols-2">
                <Link
                  to="#quick-start"
                  className="group rounded-lg border border-teal/20 bg-teal/5 p-4 transition-colors hover:border-teal/30 hover:bg-teal/10"
                >
                  <h3 className="text-lg font-medium text-teal group-hover:underline">
                    Quick Start Guide
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Learn how to create your first microfrontend application
                  </p>
                </Link>
                <Link
                  to="#architecture"
                  className="group rounded-lg border border-coral/20 bg-coral/5 p-4 transition-colors hover:border-coral/30 hover:bg-coral/10"
                >
                  <h3 className="text-lg font-medium text-coral group-hover:underline">
                    Architecture Guide
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Understand the architecture and design principles
                  </p>
                </Link>
              </div>

              <div className="rounded-lg border border-amber/20 bg-amber/5 p-4 mt-6">
                <h3 className="flex items-center gap-2 text-lg font-medium text-amber">
                  <LifeBuoy className="h-5 w-5" />
                  Need Help?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  If you encounter any issues during installation or setup,
                  check out our{' '}
                  <Link to="#troubleshooting" className="text-amber underline">
                    troubleshooting guide
                  </Link>{' '}
                  or join our{' '}
                  <Link to="#" className="text-amber underline">
                    community Discord
                  </Link>{' '}
                  for assistance.
                </p>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t pt-6">
              <Link to="#introduction">
                <Button variant="outline" size="sm" className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Introduction
                </Button>
              </Link>
              <Link to="#quick-start">
                <Button variant="outline" size="sm" className="gap-1">
                  Quick Start
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full border-t py-6 bg-gradient-to-r from-purple/5 to-teal/5">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Puzzle className="h-6 w-6 text-purple" />
            <span className="text-lg font-bold bg-gradient-to-r from-purple to-teal bg-clip-text text-transparent">
              Microfrontends
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Microfrontends. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
