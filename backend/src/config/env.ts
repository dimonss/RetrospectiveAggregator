import { z } from 'zod';

export const envSchema = z.object({
    DATABASE_PATH: z.string().default('./data/retro_aggregator.db'),
    AUTH_SERVICE_URL: z.string().url().default('https://chalysh.pro/auth/api'),
    JWT_SECRET: z.string().min(16),
    PORT: z.coerce.number().default(3001),
});

export type Env = z.infer<typeof envSchema>;

let envConfig: Env;

export function loadEnv(): Env {
    envConfig = envSchema.parse(process.env);
    return envConfig;
}

export function getEnv(): Env {
    if (!envConfig) {
        throw new Error('Environment not loaded. Call loadEnv() first.');
    }
    return envConfig;
}
