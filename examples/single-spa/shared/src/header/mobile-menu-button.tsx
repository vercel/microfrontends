import { useState } from 'react';
import { MobileMenu } from './mobile-menu';

export function MobileMenuButton(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="remote:hidden remote:sm:flex remote:gap-4">
        <button
          className="remote:inline-flex remote:h-9 remote:items-center remote:justify-center remote:rounded-md remote:border remote:border-input remote:bg-background remote:px-4 remote:py-2 remote:text-sm remote:font-medium remote:shadow-sm remote:transition-colors remote:hover:bg-muted"
          type="button"
        >
          Log in
        </button>
        <button
          className="remote:inline-flex remote:h-9 remote:items-center remote:justify-center remote:rounded-md remote:bg-primary remote:px-4 remote:py-2 remote:text-sm remote:font-medium remote:text-primary-foreground remote:shadow remote:transition-colors remote:hover:bg-primary/90"
          type="button"
        >
          Sign up
        </button>
      </div>
      <div className="remote:flex remote:sm:hidden">
        <button
          className="remote:inline-flex remote:h-9 remote:items-center remote:justify-center remote:rounded-md remote:p-2 remote:text-muted-foreground remote:hover:bg-muted remote:hover:text-foreground"
          id="mobile-menu-button"
          onClick={() => {
            setIsOpen(true);
          }}
          type="button"
        >
          <svg
            className="remote:h-5 remote:w-5"
            fill="none"
            height="24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
          <span className="remote:sr-only">Open menu</span>
        </button>
      </div>
      <MobileMenu onClose={() => setIsOpen(false)} open={isOpen} />
    </>
  );
}
