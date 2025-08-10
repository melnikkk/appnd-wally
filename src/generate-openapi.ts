import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as yaml from 'js-yaml';

async function generateOpenApiDocument() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  
  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Wally API')
    .setDescription('The API documentation for the Wally application')
    .setVersion('1.0')
    .addBearerAuth(
      { 
        type: 'http', 
        scheme: 'bearer', 
        bearerFormat: 'JWT',
        in: 'header',
      },
      'Authorization',
    )
    .addTag('policies', 'Operations related to policies')
    .addTag('rules', 'Operations related to rules')
    .addTag('analytics', 'Analytics operations')
    .addTag('webhooks', 'Webhook handlers')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  
  // Create the docs directory if it doesn't exist
  const docsDir = resolve(process.cwd(), 'docs');
  
  // Write the OpenAPI document to JSON file
  const jsonOutputPath = resolve(docsDir, 'openapi.json');
  writeFileSync(jsonOutputPath, JSON.stringify(document, null, 2), { encoding: 'utf8' });
  console.log(`OpenAPI JSON document generated at: ${jsonOutputPath}`);
  
  // Write the OpenAPI document to YAML file
  const yamlOutputPath = resolve(docsDir, 'openapi.yaml');
  writeFileSync(yamlOutputPath, yaml.dump(document), { encoding: 'utf8' });
  console.log(`OpenAPI YAML document generated at: ${yamlOutputPath}`);
  
  await app.close();
}

generateOpenApiDocument();
