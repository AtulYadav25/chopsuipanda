import { Suspense } from 'react';
import { renderApp, startWebsockets } from 'modelence/client';
import { toast } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';

import { router } from './router';
// import favicon from './assets/favicon.svg';
import './index.css';
import LoadingSpinner from './components/LoadingSpinner';

import { dAppKit } from './dapp-kit';
import { DAppKitProvider } from '@mysten/dapp-kit-react';
import notificationClientChannel from './channels/notificationClientChannel';
import gameEventClientChannel from './channels/gameEventClientChannel';

startWebsockets({
  channels: [notificationClientChannel, gameEventClientChannel],
});


renderApp({
  routesElement: (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <DAppKitProvider dAppKit={dAppKit}>
        <RouterProvider router={router} />
      </DAppKitProvider>
    </Suspense>
  ),
  errorHandler: (error) => {
    toast.error(error.message);
  },
  loadingElement: <LoadingSpinner fullScreen />,
  // favicon
});

