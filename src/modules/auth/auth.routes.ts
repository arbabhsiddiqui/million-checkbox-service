import { Router } from 'express';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import path from 'node:path';

export class AuthRouter {
    public router: Router;
    private authController: AuthController;

    constructor() {
        this.router = Router();

        // Instantiate dependencies locally
        const authService = new AuthService();
        this.authController = new AuthController(authService);

        this.setupRoutes();
    }

    private setupRoutes() {
        // Public Routes
        this.router.get('/callback', this.authController.callback);
        this.router.get('/logout', this.authController.logout);

        // Protected Routes (The controller handles its own authentication)
        this.router.get('/profile',
            this.authController.authenticate,
            (req, res) => {
                res.send(`
                    <h1>Profile</h1>
                    <pre>${JSON.stringify((req as any).user, null, 2)}</pre>
                    <a href="/logout">Logout</a>
                `);
            }
        );

        this.router.get('/dashboard',
            this.authController.authenticate,
            (req, res) => {
                res.sendFile(path.resolve(__dirname, '../../../public/index.html'));
            }
        );
    }
}