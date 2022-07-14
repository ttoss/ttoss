import * as React from 'react';

import { InstallPwaUi } from './InstallPwaUi';

export const InstallPwa = () => {
  const [supportsPwa, setSupportsPwa] = React.useState(false);
  const [promptInstall, setPromptInstall] = React.useState<any>(null);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPwa(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('transitionend', handler);
  }, []);

  const onInstall = (e: any) => {
    e.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
  };

  if (!supportsPwa) {
    return null;
  }

  return <InstallPwaUi onInstall={onInstall} />;
};
