import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { env } from '../../common/config/env';

export class AuthService {
    private jwksClient;

    constructor() {
        this.jwksClient = jwksClient({
            jwksUri: `${env.OIDC_INTERNAL_URL}/.well-known/jwks.json`,
            cache: true,
            rateLimit: true,
        });
    }

    private getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
        this.jwksClient.getSigningKey(header.kid, (err, key) => {
            callback(err, key?.getPublicKey());
        });
    };

    public async exchangeCode(code: string) {
        const response = await fetch(`${env.OIDC_INTERNAL_URL}/api/v1/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                client_id: 'project1',
                client_secret: 'secret123',
            }),
        });

        if (!response.ok) throw new Error('Token exchange failed');
        return response.json();
    }

    public verifyToken(token: string): Promise<any> {
        return new Promise((resolve, reject) => {
            jwt.verify(
                token,
                this.getKey,
                { algorithms: ['RS256'], issuer: env.OIDC_ISSUER_URL },
                (err, decoded) => {
                    if (err) reject(err);
                    else resolve(decoded);
                }
            );
        });
    }
}