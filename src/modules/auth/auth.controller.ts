import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
    constructor(private authService: AuthService) { }

    // Using arrow functions to preserve 'this' context automatically
    public authenticate = async (req: Request, res: Response, next: NextFunction) => {
        const token = req.cookies.access_token;

        if (!token) {
            return res.status(401).send('<h1>Unauthorized</h1><a href="/">Login</a>');
        }

        try {
            const decoded = await this.authService.verifyToken(token);
            (req as any).user = decoded;
            next();
        } catch (err) {
            res.clearCookie('access_token');
            return res.status(401).redirect('/');
        }
    };

    public callback = async (req: Request, res: Response) => {
        try {
            const code = req.query.code as string;
            const data = await this.authService.exchangeCode(code);

            res.cookie('access_token', data.accessToken, {
                httpOnly: true,
                maxAge: 15 * 60 * 1000,
                sameSite: 'lax',
            });

            res.redirect('/profile');
        } catch (err) {
            res.status(502).send('Authentication Failed');
        }
    };

    public logout = (req: Request, res: Response) => {
        res.clearCookie('access_token');
        res.redirect('/');
    };
}