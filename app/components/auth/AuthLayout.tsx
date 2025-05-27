import { ReactNode } from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <main className="min-h-screen flex">
      {/* Left Column - Promotional Content */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-100 to-secondary-100 p-12 items-center">
        <div className="max-w-xl">
          <Link
            href="/"
            className="text-2xl font-bold text-primary-500 hover:opacity-80 mb-12 block"
          >
            Celebration
          </Link>
          <h1 className="text-4xl font-bold text-default-800 mb-6">{title}</h1>
          <p className="text-xl leading-relaxed text-default-600">
            {description}
          </p>
        </div>
      </div>

      {/* Right Column - Form Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link
            href="/"
            className="lg:hidden text-2xl font-bold text-primary-500 hover:opacity-80 mb-12 block text-center"
          >
            Celebration
          </Link>
          {children}
        </div>
      </div>
    </main>
  );
}
