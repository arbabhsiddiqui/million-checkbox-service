import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { env } from '../config/env' // Assuming this is your env path

// Initialize the JWKS client
const client = jwksClient({
    jwksUri: `${env.ISSUER}/.well-known/jwks.json`, // e.g., http://localhost:6001/.well-known/jwks.json
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5
})

// Helper to retrieve the signing key based on the 'kid' (Key ID) in the JWT header
const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            return callback(err)
        }
        const signingKey = key?.getPublicKey()
        callback(null, signingKey)
    })
}

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    // 1. Guard clause: Ensure header exists and starts with Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No Bearer token' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Extra safety: Ensure token string actually exists after the split
    if (!token) {
        return res.status(401).json({ error: 'Invalid token format' });
    }

    // Now TypeScript knows 'token' is definitely a string
    jwt.verify(
        token,
        getKey,
        {
            algorithms: ['RS256'],
            issuer: env.ISSUER
        },
        (err, payload) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            (req as any).user = payload;
            next();
        }
    );
};