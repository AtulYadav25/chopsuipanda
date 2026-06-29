import { SuiGrpcClient } from '@mysten/sui/grpc';

export type SuiNetwork =
    | 'devnet'
    | 'testnet'
    | 'mainnet';

export function getSuiNetworkUrl(
    network: SuiNetwork,
): string {
    switch (network) {
        case 'devnet':
            return 'https://fullnode.devnet.sui.io:443';

        case 'testnet':
            return 'https://fullnode.testnet.sui.io:443';

        case 'mainnet':
            return 'https://fullnode.mainnet.sui.io:443';

        default:
            throw new Error(
                `Unsupported SUI network: ${network}`,
            );
    }
}

const SUI_NETWORK = 'testnet';

// Singleton instance — reused across the app instead of
// creating a new client per request/call.
export const suiClient = new SuiGrpcClient({
    network: SUI_NETWORK,
    baseUrl: getSuiNetworkUrl(SUI_NETWORK),
});

export default suiClient;