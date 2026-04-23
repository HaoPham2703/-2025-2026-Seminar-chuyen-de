import swaggerJsdoc from 'swagger-jsdoc';
import { groupedSwaggerPaths, groupedSwaggerTags } from './swagger-groups.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DACN API Documentation',
      version: '1.0.0',
      description: 'API documentation for DACN HR Management System',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    tags: groupedSwaggerTags,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Success message',
            },
            data: {
              type: 'object',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            email: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['EMPLOYEE', 'TENANT_ADMIN', 'SUPER_ADMIN'],
            },
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
            },
            tenantId: {
              type: 'string',
              description: 'Optional tenant ID',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: groupedSwaggerPaths,
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
