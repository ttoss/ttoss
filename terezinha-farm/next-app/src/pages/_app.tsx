import { ThemeProvider } from '@ttoss/ui';
import type { AppProps } from 'next/app';

type AppOwnProps = object;

const MyCustomApp = ({ Component, pageProps }: AppProps & AppOwnProps) => {
  return (
    <>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
};

export default MyCustomApp;
