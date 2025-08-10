import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Webhook } from 'svix';
import { ClerkWebhooksService } from './clerk-webhooks.service';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../auth/decorators/public.decorator';
import { 
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('webhooks')
@Controller('webhooks/clerk')
@Public()
export class ClerkWebhooksController {
  private readonly logger = new Logger(ClerkWebhooksController.name);

  constructor(
    private readonly clerkWebhooksService: ClerkWebhooksService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Handle Clerk webhook', description: 'Processes webhooks from Clerk for user and organization events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - missing headers' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid signature' })
  @ApiHeader({ name: 'svix-signature', required: true, description: 'Svix signature for webhook verification' })
  @ApiHeader({ name: 'svix-id', required: true, description: 'Svix ID for webhook verification' })
  @ApiHeader({ name: 'svix-timestamp', required: true, description: 'Svix timestamp for webhook verification' })
  @ApiBody({ description: 'Clerk webhook payload' })
  async handleWebhook(
    @Headers('svix-signature') signature: string,
    @Headers('svix-id') id: string,
    @Headers('svix-timestamp') timestamp: string,
    @Body() payload: any,
  ) {
    if (!signature || !id || !timestamp) {
      throw new BadRequestException('Missing required Svix headers');
    }

    const isValidWebhook = this.verifyWebhookSignature(signature, id, timestamp, payload);

    if (!isValidWebhook) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const { type, data } = payload;

    switch (type) {
      case 'user.created':
        return this.clerkWebhooksService.handleUserCreated(data);

      case 'organization.created':
        return this.clerkWebhooksService.handleOrganizationCreated(data);

      case 'user.updated':
        return this.clerkWebhooksService.handleUserUpdated(data);

      case 'organization.updated':
        return this.clerkWebhooksService.handleOrganizationUpdated(data);

      case 'user.deleted':
        return this.clerkWebhooksService.handleUserDeleted(data);

      case 'organization.deleted':
        return this.clerkWebhooksService.handleOrganizationDeleted(data);

      default:
        return { message: `Webhook event ${type} received but no handler implemented` };
    }
  }

  private verifyWebhookSignature(
    svixSignature: string,
    svixId: string,
    svixTimestamp: string,
    payload: string,
  ): boolean {
    try {
      const secret = this.configService.get<string>('CLERK_WEBHOOK_SECRET');

      if (!secret) {
        this.logger.error('Clerk webhook secret is not set');

        return false;
      }

      const webhook = new Webhook(secret);

      webhook.verify(JSON.stringify(payload), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });

      return true;
    } catch (error) {
      this.logger.error('Webhook verification failed', error);

      return false;
    }
  }
}
