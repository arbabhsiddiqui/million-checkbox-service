import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import ApiError from '../utils/api-error';

export const validate = (schema: ZodSchema) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // public property is .issues, not .errors
                const message = error.issues
                    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                    .join(', ');

                return next(ApiError.badRequest(message));
            }
            next(error);
        }
    };