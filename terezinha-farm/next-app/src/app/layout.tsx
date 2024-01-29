import { RootProviders } from './RootProviders';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terezinha Farm',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
};

export default RootLayout;
