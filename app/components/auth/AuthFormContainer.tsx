import { ReactNode } from 'react';
import Link from 'next/link';
import { Form } from '@heroui/form';

interface AuthFormContainerProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  subtitleLink: {
    text: string;
    href: string;
  };
  onSubmit: (event: React.FormEvent) => void;
}

export function AuthFormContainer({
  children,
  title,
  subtitle,
  subtitleLink,
  onSubmit,
}: AuthFormContainerProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <div className="text-sm">
          <span className="text-default-500">{subtitle} </span>
          <Link
            href={subtitleLink.href}
            className="text-primary-500 hover:underline font-medium"
          >
            {subtitleLink.text}
          </Link>
        </div>
      </div>

      <Form className="space-y-6" onSubmit={onSubmit} validationBehavior="aria">
        {children}
      </Form>
    </>
  );
}
