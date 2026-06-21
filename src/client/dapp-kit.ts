// src/dapp-kit.ts
import { createDAppKit } from '@mysten/dapp-kit-react';
import { SuiGrpcClient } from '@mysten/sui/grpc';

const GRPC_URLS = {
    testnet: 'https://fullnode.testnet.sui.io:443',
    mainnet: 'https://fullnode.mainnet.sui.io:443',
};

export const dAppKit = createDAppKit({
    networks: ['testnet', 'mainnet'],
    defaultNetwork: 'testnet',
    createClient: (network) =>
        new SuiGrpcClient({ network, baseUrl: GRPC_URLS[network] }),
    autoConnect: true, // auto-reconnect to last used wallet
});

// Register types so all hooks are properly inferred
declare module '@mysten/dapp-kit-react' {
    interface Register {
        dAppKit: typeof dAppKit;
    }
}