import jwt from 'jsonwebtoken';
import { throwError } from './responsHandler';

export const generateJWTToken = <T extends object>(data: T, secret: string, options?: { expiresIn: number }) => {
    try {
        const token = jwt.sign(data, secret, options);
        return token;
    } catch (error) {
        return throwError((error as Error).message);
    }
}

export const verifyJWTToken = <T extends object>(token: string, secret: string) => {
    try {
        const decoded = jwt.verify(token, secret);
        return decoded as T;
    } catch (error) {
        return throwError((error as Error).message);
    }
}

export type PlayerAuthToken = {
    walletAddress: string;
    time: number;
}

export type ChiPurchaseToken = {
    walletAddress: string;
    packId: string;
    message: string;
    amount: number; //Amount of CHI to be received
    costInMistToPay: number; // SUI MIST to pay
    timestamp: number;
}