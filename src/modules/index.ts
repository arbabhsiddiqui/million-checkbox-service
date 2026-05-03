import express, { Request, Response, NextFunction } from 'express';
import type { Express } from 'express';
import cookieParser from "cookie-parser";
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { env } from '../common/config/env';

/**
 * 1. JWKS Client Configuration
 * This fetches the public key from the OIDC server (6001)
 */
const client = jwksClient({
    // Use 'oidc_app' for server-to-server communication if in Docker, 
    // otherwise use 'localhost'
    jwksUri: `http://oidc_app:6001/.well-known/jwks.json`,
    cache: true,
    rateLimit: true
});

const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        callback(null, key?.getPublicKey());
    });
};

/**
 * 2. Authentication Middleware
 * Protects routes by checking the HttpOnly cookie
 */
const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.access_token;

    if (!token) {
        return res.status(401).send('<h1>401 Unauthorized</h1><p>Please <a href="/">login</a> first.</p>');
    }

    jwt.verify(
        token,
        getKey,
        { algorithms: ['RS256'], issuer: 'http://localhost:6001' },
        (err, decoded) => {
            if (err) {
                console.error('JWT Verification Error:', err.message);
                res.clearCookie('access_token');
                return res.status(401).redirect('/');
            }
            // Successfully decoded - attach to req.user
            (req as any).user = decoded;
            next();
        }
    );
};

/**
 * 3. Application Factory
 */
export function createExpressApplication(): Express {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // Health Check
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    // Public Landing Page
    app.get("/", (req, res) => {
        res.send(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                    <h1>Welcome to the OIDC Client App</h1>
                    <p>Protect your session with HttpOnly Cookies</p>
                    <a href="http://localhost:6001/api/v1/auth/authorize?client_id=project1&redirect_uri=http://localhost:3001/callback&state=xyz" 
                       style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                       Login with OIDC Server
                    </a>
                </body>
            </html>
        `);
    });

    // OIDC Callback Route
    app.get('/callback', async (req, res) => {
        try {
            const code = req.query.code as string;
            if (!code) return res.status(400).send('Missing authorization code');

            // Exchange Code for Tokens
            const result = await fetch('http://oidc_app:6001/api/v1/auth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    client_id: 'project1',
                    client_secret: 'secret123',
                }),
            });

            if (!result.ok) {
                const errorText = await result.text();
                console.error('Token Exchange Failed:', errorText);
                return res.status(502).send('Token exchange failed');
            }

            const data: any = await result.json();

            // ✅ SECURE STEP: Save access token in HttpOnly Cookie
            res.cookie('access_token', data.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            // Redirect to protected profile
            res.redirect('/profile');

        } catch (err) {
            console.error('Callback Error:', err);
            res.status(500).send('Something went wrong during callback');
        }
    });

    // ✅ PROTECTED ROUTE: Only accessible if logged in
    app.get('/profile', authenticate, (req: Request, res: Response) => {
        const decodedUser = (req as any).user;

        res.send(`
            <html>
                <body style="font-family: sans-serif; padding: 40px;">
                    <h2>✅ Login Successful</h2>
                    <p>Your session is now secured via an <strong>HttpOnly Cookie</strong>.</p>
                    <hr />
                    <h3>User Data (from Token Claims):</h3>
                    <pre style="background: #eee; padding: 20px; border-radius: 8px;">${JSON.stringify(decodedUser, null, 2)}</pre>
                    <br />
                    <a href="/logout" style="color: red;">Logout</a>
                </body>
            </html>
        `);
    });

    // Logout: Clear the cookie
    app.get('/logout', (req, res) => {
        res.clearCookie('access_token');
        res.redirect('/');
    });

    return app;
}