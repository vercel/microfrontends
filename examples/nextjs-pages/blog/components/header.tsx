import { Link } from '@vercel/microfrontends/next/client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import mfeIcon from '../public/mfe-icon-dark.png';

export function BlogHeader() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex">
            <Link className="flex-shrink-0 flex items-center" href="/">
              <Image
                alt="MFE Icon"
                className="inline-block mr-2"
                height={32}
                src={mfeIcon}
                width={32}
              />
              <span className="text-2xl font-semibold text-gray-900">
                Microfrontends Blog
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                href="/blog"
              >
                Home
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Button asChild variant="ghost">
              <Link href="/">Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}
