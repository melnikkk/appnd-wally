# Wally API OpenAPI Documentation

This project uses OpenAPI (Swagger) to provide comprehensive documentation for all API endpoints. This guide will help you navigate and use the API documentation.

## Accessing the API Documentation

You can access the OpenAPI documentation without running the server using the following options:

1. **Generate Static OpenAPI Files:**

   Run the following command to generate static OpenAPI files:

   ```bash
   npm run openapi:generate
   ```

   This will generate:
   - `docs/openapi.json` - OpenAPI specification in JSON format
   - `docs/openapi.yaml` - OpenAPI specification in YAML format

2. **View Static Documentation:**

   Open `docs/swagger-ui.html` in a web browser to view the API documentation from the static JSON file.

3. **Serve Static Documentation:**

   Run the following command to serve the static documentation and open it in your browser:

   ```bash
   npm run openapi:serve
   ```

   This will start a simple HTTP server on port 8090 and automatically open the Swagger UI page.

4. **Use with Third-Party Tools:**

   The generated `openapi.json` and `openapi.yaml` files can be imported into tools like:
   - Postman
   - Insomnia
   - Swagger Editor (https://editor.swagger.io/)
   - Stoplight Studio

## Features

The OpenAPI documentation provides:

- Detailed information about all available endpoints
- Request and response schemas
- Authentication requirements
- Ability to try out API calls directly from the browser

## API Endpoints

The API is organized into the following sections:

### Policies

Operations related to managing policies:

- `POST /policies` - Create a new policy
- `GET /policies` - List all policies with optional filters
- `GET /policies/{id}` - Get a specific policy by ID
- `PATCH /policies/{id}` - Update a policy
- `DELETE /policies/{id}` - Delete a policy
- `POST /policies/evaluate` - Evaluate a prompt against active policies

### Rules

Operations related to managing rules within policies:

- `POST /policies/{policyId}/rules` - Create a new rule for a policy
- `GET /policies/{policyId}/rules` - List all rules for a policy
- `GET /policies/{policyId}/rules/{id}` - Get a specific rule
- `PATCH /policies/{policyId}/rules/{id}` - Update a rule
- `DELETE /policies/{policyId}/rules/{id}` - Delete a rule

### Analytics

Operations related to analytics:

- `POST /analytics/process-logs` - Process user logs for analytics
- `GET /analytics/job/{id}` - Get the status of a processing job

### Webhooks

Webhook handlers:

- `POST /webhooks/clerk` - Handle Clerk webhooks for user and organization events

## Authentication

Most endpoints require authentication using a bearer token. The Clerk integration is used for authentication.

## Using the Documentation

1. Open the documentation URL in your browser
2. Expand an endpoint to see details
3. Click "Try it out" to test an endpoint
4. Fill in any required parameters
5. Click "Execute" to make the API call
6. View the response

## Response Codes

- `200` - Successful operation
- `201` - Resource created successfully
- `400` - Bad request or validation error
- `401` - Unauthorized (missing or invalid authentication)
- `404` - Resource not found
- `500` - Server error

## Development

If you need to add new endpoints or modify existing ones, make sure to update the OpenAPI decorators in the controller files to keep the documentation in sync with the implementation.
