import type { ReactNode } from 'react';

export const metadata = {
  title: 'Client agent app',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
