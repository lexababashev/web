'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Navbar, NavbarBrand } from '@heroui/navbar';

interface HeaderProp {
  /**
   * The page to navigate to when clicking the back/dashboard button
   * @default '/dashboard'
   */
  backTo?: string;

  /**
   * The text to display on the back/dashboard button
   * @default 'Dashboard'
   */
  backText?: string;

  /**
   * Whether to show the back/dashboard button
   * @default false
   */
  showBackButton?: boolean;

  /**
   * Additional actions to be displayed on the right side of the header
   */
  actions?: ReactNode;
}

export function Header({
  backTo = '/dashboard',
  backText = 'Dashboard',
  showBackButton = false,
  actions,
}: HeaderProp) {
  const router = useRouter();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Navbar
      isBlurred={true}
      className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-default-100 min-h-[72px]"
      maxWidth="xl"
    >
      <div className="flex w-full justify-between items-center px-4 sm:px-6 py-4 min-h-[72px]">
        <NavbarBrand>
          <button
            onClick={scrollToTop}
            className="font-bold text-xl text-primary-500 hover:opacity-80"
          >
            Celebration
          </button>
        </NavbarBrand>
        <div className="flex items-center gap-4">
          {actions}
          {showBackButton && (
            <Button
              color="primary"
              variant="light"
              onPress={() => router.push(backTo)}
            >
              {backText}
            </Button>
          )}
        </div>
      </div>
    </Navbar>
  );
}
