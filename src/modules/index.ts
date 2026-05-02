import express from 'express'
import type { Express } from 'express'

import cookieParser from "cookie-parser";

// import { authRouter } from './auth/auth.routes'
// import { router as oidcRouter } from './auth/oidc.routes'


export function createExpressApplication(): Express {
    const app = express()


    app.use(express.json())
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok' })
    })

    // app.use(oidcRouter)
    // app.use('/api/v1/auth', authRouter)

    return app
}