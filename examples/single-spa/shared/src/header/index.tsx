import React from 'react';
import ReactDOMClient from 'react-dom/client';
import singleSpaReact from 'single-spa-react';
import { MobileMenuButton } from './mobile-menu-button';
import '../globals.css';
import './header.css';

function Header(): React.JSX.Element {
  return (
    <header className="remote:sticky remote:top-0 remote:z-50 remote:w-full remote:border-b remote:border-b-muted remote:bg-background/95 backdrop-blur remote:supports-[backdrop-filter]:bg-background/60">
      <div className="remote:container remote:flex remote:h-16 remote:items-center remote:justify-between">
        <a className="remote:flex remote:items-center remote:gap-2" href="/">
          <img
            alt="Logo"
            className="remote:rounded"
            height="32"
            src="/abstract-geometric-logo.png"
            width="32"
          />
          <span className="remote:text-xl remote:font-bold">Company</span>
        </a>
        <nav className="remote:hidden remote:sm:flex remote:gap-6 ">
          <a
            className="remote:text-sm remote:font-medium remote:hover:text-primary"
            href="#features"
          >
            Features
          </a>
          <a
            className="remote:text-sm remote:font-medium remote:hover:text-primary"
            href="#testimonials"
          >
            Testimonials
          </a>
          <a
            className="remote:text-sm remote:font-medium remote:hover:text-primary"
            href="#pricing"
          >
            Pricing
          </a>
          <a
            className="remote:text-sm remote:font-medium remote:hover:text-primary"
            href="#about"
          >
            About
          </a>
        </nav>
        <MobileMenuButton />
      </div>
    </header>
  );
}

export const { bootstrap, mount, unmount } = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: Header,
  errorBoundary() {
    return <></>;
  },
});
