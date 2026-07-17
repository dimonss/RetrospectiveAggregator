import 'dotenv/config';

// Bypass SSL certificate verification issues in local development (chalysh.pro intermediate cert chain issue)
// if (process.env.NODE_ENV !== 'production') {
//     process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// }

import { loadEnv } from './config/env.js';
import { initDb } from './db/connection.js';
import { buildApp } from './app.js';

async function main() {
    // 1. Load and validate env
    const env = loadEnv();

    // 2. Initialize database
    initDb(env.DATABASE_PATH);

    // 3. Build and start Fastify
    const app = await buildApp();

    try {
        await app.listen({ port: env.PORT, host: '0.0.0.0' });
        console.log(`\n🚀 Server running at http://localhost:${env.PORT}`);
        console.log(`📚 Swagger docs at http://localhost:${env.PORT}/api/docs\n`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

main();
