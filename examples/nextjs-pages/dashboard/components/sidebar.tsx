import { Link } from '@vercel/microfrontends/next/client';
import { LayoutTemplate, Settings } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '#', icon: LayoutTemplate, current: true },
  { name: 'Settings', href: '#', icon: Settings, current: false },
];

export function Sidebar() {
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-white text-2xl font-semibold">
                Microfrontends
              </span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  className={`${
                    item.current
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  href={item.href}
                  key={item.name}
                >
                  <item.icon
                    aria-hidden="true"
                    className={`${
                      item.current
                        ? 'text-gray-300'
                        : 'text-gray-400 group-hover:text-gray-300'
                    } mr-3 flex-shrink-0 h-6 w-6`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
