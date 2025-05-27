import { HeroUIProvider } from '@heroui/react';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Celebration - Create Celebration Videos',
  description: 'Create beautiful celebration videos with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className={inter.className}>
        <Providers>
          <HeroUIProvider>{children}</HeroUIProvider>
        </Providers>
      </body>
    </html>
  );
}
