import express from 'express';
import type { Express } from 'express';
import cookieParser from "cookie-parser";
import { AuthRouter } from './auth/auth.routes';
import { env } from '../common/config/env';
import { redis } from '../redis-connection';
import { CHECKBOX_SIZE, CHECKBOX_STATE_KEY } from '..';


export function createExpressApplication(): Express {
    const app = express();




    app.use(express.json());
    app.use(cookieParser());

    // Initialize the Router
    const authRouter = new AuthRouter();






    // Landing Page (Public)
    app.get('/', (req, res) => {
        res.send(`<h1>Home</h1><a href="http://localhost:6001/api/v1/auth/authorize?client_id=${env.OIDC_CLIENT_ID}&redirect_uri=http://localhost:${env.PORT}/callback&state=xyz">Login</a>`);

    });

    app.get('/checkboxes', async (req, res) => {
        const existingState = await redis.get(CHECKBOX_STATE_KEY)

        if (existingState) {
            const remoteData = JSON.parse(existingState)
            return res.json({ checkboxes: remoteData })
        }
        res.json({ checkboxes: new Array(CHECKBOX_SIZE).fill(false) });
    });

    // Mount the Auth Router
    // Note: If you use app.use('/auth', authRouter.router), 
    // your URLs become /auth/callback, etc. 
    // For now, we mount it at root to match your OIDC config.
    app.use(authRouter.router);

    return app;
}