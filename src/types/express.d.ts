declare global {
    namespace Express {
        interface AuthUser {
            userId: string
            email?: string
            role?: string
        }

        interface Request {
            user?: AuthUser
        }
    }
}

export { }