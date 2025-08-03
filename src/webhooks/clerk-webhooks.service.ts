import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class ClerkWebhooksService {
  private readonly logger = new Logger(ClerkWebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleUserCreated(data: any): Promise<void> {
    try {
      this.logger.log(`Processing user.created event for ${data.email_addresses?.[0]?.email_address}`);

      const email = data.email_addresses?.[0]?.email_address;

      if (!email) {
        this.logger.warn('No email address found in user data');

        return;
      }

      await this.prisma.user.create({
        data: {
          email,
          clerkUserId: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          role: UserRole.USER,
        },
      });

      this.logger.log(`User ${email} created successfully`);
    } catch (error) {
      this.logger.error(`Error handling user.created event: ${error.message}`, error.stack);
      throw error;
    }
  }

  async handleOrganizationCreated(data: any): Promise<void> {
    try {
      this.logger.log(`Processing organization.created event for ${data.name}`);

      const organization = await this.prisma.organization.create({
        data: {
          clerkOrganizationId: data.id,
          name: data.name,
        },
      });

      if (data.created_by) {
        const user = await this.prisma.user.findUnique({
          where: { clerkUserId: data.created_by },
        });

        if (user) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              organizationId: organization.id,
              role: UserRole.OWNER,
            },
          });
        }
      }

      this.logger.log(`Organization ${data.name} created successfully`);
    } catch (error) {
      this.logger.error(`Error handling organization.created event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle user update events from Clerk
   */
  async handleUserUpdated(data: any): Promise<void> {
    try {
      this.logger.log(`Processing user.updated event for ${data.email_addresses?.[0]?.email_address}`);

      const email = data.email_addresses?.[0]?.email_address;
      if (!email) {
        this.logger.warn('No email address found in user data');
        return;
      }

      // Find the user and update details
      const existingUser = await this.prisma.user.findUnique({
        where: { clerkUserId: data.id },
      });

      if (!existingUser) {
        this.logger.warn(`User with Clerk ID ${data.id} not found`);
        return;
      }

      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email: email,
          firstName: data.first_name,
          lastName: data.last_name,
        },
      });

      this.logger.log(`User ${email} updated successfully`);
    } catch (error) {
      this.logger.error(`Error handling user.updated event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle organization update events from Clerk
   */
  async handleOrganizationUpdated(data: any): Promise<void> {
    try {
      this.logger.log(`Processing organization.updated event for ${data.name}`);

      const existingOrg = await this.prisma.organization.findUnique({
        where: { clerkOrganizationId: data.id },
      });

      if (!existingOrg) {
        this.logger.warn(`Organization with Clerk ID ${data.id} not found`);
        return;
      }

      await this.prisma.organization.update({
        where: { id: existingOrg.id },
        data: {
          name: data.name,
        },
      });

      this.logger.log(`Organization ${data.name} updated successfully`);
    } catch (error) {
      this.logger.error(`Error handling organization.updated event: ${error.message}`, error.stack);
      throw error;
    }
  }
}
