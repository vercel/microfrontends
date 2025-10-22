import { Link } from '@vercel/microfrontends/next/client';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Microfrontends Dashboard
          </h1>
          <Button asChild variant="ghost">
            <Link href="/blog">Blog</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
