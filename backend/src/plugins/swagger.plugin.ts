import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import type { FastifyInstance } from 'fastify';

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

    await app.register(swaggerUi, {
        routePrefix: '/api/docs',
    });
});
