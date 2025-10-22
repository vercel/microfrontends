export function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <div
      className={`remote:fixed remote:top-0 remote:inset-0 remote:z-50 remote:bg-background/80 remote:backdrop-blur-sm remote:md:hidden${open ? '' : ' remote:hidden'}`}
      id="mobile-menu"
    >
      <div className="remote:fixed remote:inset-y-0 remote:top-0 remote:right-0 remote:w-full remote:min-h-svh remote:max-w-xs remote:bg-background remote:p-6 remote:shadow-lg">
        <div className="remote:flex remote:items-center remote:justify-between">
          <a
            className="remote:flex remote:items-center remote:gap-2"
            href="/"
            onClick={onClose}
          >
            <img
              alt="Logo"
              className="remote:rounded"
              height="32"
              src="/abstract-geometric-logo.png"
              width="32"
            />
            <span className="remote:text-xl remote:font-bold">Company</span>
          </a>
          <button
            className="remote:inline-flex remote:h-9 remote:items-center remote:justify-center remote:rounded-md remote:p-2 remote:text-muted-foreground remote:hover:bg-muted remote:hover:text-foreground"
            id="close-mobile-menu"
            onClick={onClose}
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            <span className="remote:sr-only">Close menu</span>
          </button>
        </div>
        <nav className="remote:mt-6 remote:flex remote:flex-col remote:gap-4">
          <a
            className="remote:text-base remote:font-medium remote:hover:text-primary"
            href="#features"
            onClick={onClose}
          >
            Features
          </a>
          <a
            className="remote:text-base remote:font-medium remote:hover:text-primary"
            href="#testimonials"
            onClick={onClose}
          >
            Testimonials
          </a>
          <a
            className="remote:text-base remote:font-medium remote:hover:text-primary"
            href="#pricing"
            onClick={onClose}
          >
            Pricing
          </a>
          <a
            className="remote:text-base remote:font-medium remote:hover:text-primary"
            href="#about"
            onClick={onClose}
          >
            About
          </a>
          <div className="remote:mt-4 remote:flex remote:flex-col remote:gap-2">
            <button
              className="remote:inline-flex remote:h-10 remote:w-full remote:items-center remote:justify-center remote:rounded-md remote:border remote:border-input remote:bg-background remote:px-4 remote:py-2 remote:text-sm remote:font-medium remote:shadow-sm remote:transition-colors remote:hover:bg-muted"
              onClick={onClose}
              type="button"
            >
              Log in
            </button>
            <button
              className="remote:inline-flex remote:h-10 remote:w-full remote:items-center remote:justify-center remote:rounded-md remote:bg-primary remote:px-4 remote:py-2 remote:text-sm remote:font-medium remote:text-primary-foreground remote:shadow remote:transition-colors remote:hover:bg-primary/90"
              onClick={onClose}
              type="button"
            >
              Sign up
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
