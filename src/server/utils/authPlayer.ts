import { Request } from 'express';
import { throwError } from './responsHandler';
import jwt, { JwtPayload } from 'jsonwebtoken'
import configModule from '../modules/configModule';
import { PlayerAuthToken, verifyJWTToken } from './jwtHelper';


export const requirePlayer = (req: Request): PlayerAuthToken => {
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
        const decoded = verifyJWTToken<PlayerAuthToken>(token, configModule.getConfig('JWT_SECRET'));

        return decoded
    } catch (error) {
        return throwError((error as Error).message)
    }
};