import { Request } from 'express';
import { throwError } from './responsHandler';
import jwt from 'jsonwebtoken'
import configModule from '../modules/configModule';


export const requirePlayer = (req: Request): { walletAddress: string } => {
    try {
        const sessionCookie = req.headers.cookie;

        if (!sessionCookie) {
            return throwError("Please connect wallet to continue");
        }

        // Parse cookie string into key-value map
        const cookies = Object.fromEntries(
            sessionCookie.split('; ').map(c => {
                const [key, ...v] = c.split('=');
                return [key.trim(), decodeURIComponent(v.join('='))];
            })
        );

        const token = cookies['token']; // adjust cookie name if different

        if (!token) {
            return throwError("Please connect wallet to continue");
        }

        // Verify the Privy access token
        const decoded = jwt.verify(token, configModule.getConfig('JWT_SECRET'));

        if (!decoded) {
            return throwError("Token Expired, Connect Wallet Again!");
        }


        return {
            walletAddress: (decoded as any).walletAddress
        }


    } catch (error) {
        console.error('Error fetching authenticated user:', error);
        throwError((error as Error).message)
        return { walletAddress: "error" }
    }
};