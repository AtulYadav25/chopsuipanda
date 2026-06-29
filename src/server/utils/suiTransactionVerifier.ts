import { SuiGrpcClient } from '@mysten/sui/grpc';
import { isValidTransactionDigest } from '@mysten/sui/utils';
import configModule from '../modules/configModule';
import suiClient from './suiClient';

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface VerifyTransactionOptions {
    maxAgeMinutes?: number;
}

interface VerifyTransactionResult {
    verified: boolean;
    timestamp: Date;
    sender: string;
    gasUsed: unknown;
    digest: string;
    events: unknown[];
    error: string | null;
}

export class SuiTransactionVerifier {
    private client: SuiGrpcClient;

    constructor() {

        this.client = suiClient
    }

    async verifyTransaction(
        txDigest: string,
        walletAddress: string,
        options: VerifyTransactionOptions = {
            maxAgeMinutes: 10,
        },
    ): Promise<
        VerifyTransactionResult | { verified: false; message: string }
    > {
        try {
            if (!isValidTransactionDigest(txDigest)) {
                throw new Error('Invalid transaction digest format');
            }

            const MODULE_NAME = configModule.getConfig('MODULE_NAME');
            const PACKAGE_ID = configModule.getConfig('PACKAGE_ID');

            await delay(3000);

            const txResponse = await this.client.getTransaction({
                digest: txDigest,
                include: {
                    effects: true,
                    transaction: true,
                    events: true,
                    bcs: true
                },

            });

            if (!txResponse) {
                throw new Error('Transaction not found');
            }

            // TODO : this is not real txTimestamp check from console log where i could get the timestamp
            const txTimestamp = new Date(
                Number(txResponse.Transaction?.bcs),
            );

            const ageInMinutes =
                (Date.now() - txTimestamp.getTime()) /
                (1000 * 60);

            if (
                ageInMinutes >
                (options.maxAgeMinutes ?? 10)
            ) {
                throw new Error(
                    `Transaction is too old (${Math.round(
                        ageInMinutes,
                    )} minutes)`,
                );
            }

            const isSuccessful =
                txResponse.Transaction?.effects.status.success === true;


            const sender =
                txResponse.Transaction?.transaction.sender;

            if (!sender) {
                throw new Error("Invalid Access")
            }

            if (sender.trim() !== walletAddress.trim()) {
                throw new Error('Invalid Access');
            }

            // TODO : Check from console log of transaction block if it really includes the eventType
            const purchaseEventSmartContract =
                txResponse.Transaction?.events.find(
                    (event) =>
                        event.eventType ===
                        `${PACKAGE_ID}::${MODULE_NAME}::PaidToContract`,
                );

            if (
                !purchaseEventSmartContract ||
                !purchaseEventSmartContract.json ||
                typeof purchaseEventSmartContract.json !== 'object' ||
                !('amount' in purchaseEventSmartContract.json)
            ) {
                throw new Error("Invalid Transaction")
            }

            const result: VerifyTransactionResult = {
                verified: isSuccessful,
                timestamp: txTimestamp, //TODO : Fix this, this is mock timestamp
                sender,
                gasUsed: txResponse.Transaction?.transaction.gasData.price,
                digest: txDigest,
                events: txResponse.Transaction?.events ?? [],
                error: isSuccessful
                    ? null
                    : "Invalid Transaction",
            };


            return result;
        } catch (error) {
            const err =
                error instanceof Error
                    ? error
                    : new Error('Unknown error');


            throw err;
        }
    }
}

export default SuiTransactionVerifier;