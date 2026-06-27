import { Suspense } from 'react';
import { renderApp, startWebsockets, getWebsocketClientProvider } from 'modelence/client';
import { toast } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModelenceQueryClient } from '@modelence/react-query';

import { router } from './router';
// import favicon from './assets/favicon.svg';
import './index.css';
import './style.css'
import LoadingSpinner from './components/LoadingSpinner';

import { dAppKit } from './dapp-kit';
import { DAppKitProvider } from '@mysten/dapp-kit-react';
import notificationClientChannel from '@/client/channels/notificationClientChannel';
import gameEventClientChannel from '@/client/channels/gameEventClientChannel';
import { ToastProvider } from './context/ToastContext';
import { PlayerAuthProvider } from './context/PlayerAuthContext';

const queryClient = new QueryClient();
new ModelenceQueryClient().connect(queryClient);

startWebsockets({
  channels: [notificationClientChannel, gameEventClientChannel],
});

notificationClientChannel.init();
gameEventClientChannel.init();



renderApp({
  routesElement: (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <QueryClientProvider client={queryClient}>
        <DAppKitProvider dAppKit={dAppKit}>
          <PlayerAuthProvider>
            <ToastProvider>
              <RouterProvider router={router} />
            </ToastProvider>
          </PlayerAuthProvider>
        </DAppKitProvider>
      </QueryClientProvider>
    </Suspense>
  ),
  errorHandler: (error) => {
    toast.error(error.message);
  },
  loadingElement: <LoadingSpinner fullScreen />,
  // favicon
});

