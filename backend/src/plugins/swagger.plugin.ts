import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import type { FastifyInstance } from 'fastify';
import { getEnv } from '../config/env.js';

export default fp(async function swaggerPlugin(app: FastifyInstance) {
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'RetroAggregator API',
                description: 'Backend API for Retrospective Aggregator',
                version: '1.0.0',
            },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        },
        transform: jsonSchemaTransform,
    });

    const baseUrl = getEnv().BASE_URL;

    await app.register(swaggerUi, {
        routePrefix: `${baseUrl}/docs`,
    });
});
