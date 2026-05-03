import { z } from 'zod'
import "dotenv/config"


const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(8080),
    DATABASE_URI: z.string().default('postgresql://postgres:password@localhost:5432/mydb'),
    OIDC_INTERNAL_URL: z.string().default('http://localhost:6001'),
    OIDC_ISSUER_URL: z.string().default('http://localhost:6001'),
})

export const env = envSchema.parse(process.env)