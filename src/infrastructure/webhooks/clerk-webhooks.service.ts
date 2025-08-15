import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../../user/user.service';
import { CreateUserDto } from '../../user/repositories/user-repository.interface';

@Injectable()
export class ClerkWebhooksService {
  private readonly logger = new Logger(ClerkWebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async handleUserCreated(data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
    }>;
    first_name: string;
    last_name: string;
  }): Promise<void> {
    try {
      this.logger.log(
        `Processing user.created event for ${data.email_addresses?.[0]?.email_address}`,
      );

      const email = data.email_addresses?.[0]?.email_address;

      if (!email) {
        this.logger.warn('No email address found in user data');
        return;
      }

      const createUserDto: CreateUserDto = {
        email,
        clerkUserId: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        role: UserRole.USER,
      };

      await this.userService.createUser(createUserDto);

      this.logger.log(`User ${email} created successfully`);
    } catch (error) {
      this.logger.error(
        `Error handling user.created event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async handleOrganizationCreated(data: {
    name: string;
    id: string;
    created_by: string;
  }): Promise<void> {
    try {
      this.logger.log(`Processing organization.created event for ${data.id}`);

      const organization = await this.prisma.organization.create({
        data: {
          clerkOrganizationId: data.id,
          name: data.name,
        },
      });

      if (data.created_by) {
        const user = await this.userService.findUserByClerkId(data.created_by);

        if (user) {
          await this.userService.updateUser(user.id, {
            organizationId: organization.id,
            role: UserRole.OWNER,
          });
        }
      }

      this.logger.log(`Organization ${data.id} created successfully`);
    } catch (error) {
      this.logger.error(
        `Error handling organization.created event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async handleUserUpdated(data: any): Promise<void> {
    try {
      this.logger.log(
        `Processing user.updated event for ${data.email_addresses?.[0]?.email_address}`,
      );

      const email = data.email_addresses?.[0]?.email_address;

      if (!email) {
        this.logger.warn('No email address found in user data');
        return;
      }

      const existingUser = await this.userService.findUserByClerkId(data.id);

      if (!existingUser) {
        this.logger.warn(`User with Clerk ID ${data.id} not found`);
        return;
      }

      await this.userService.updateUser(existingUser.id, {
        email: email,
        firstName: data.first_name,
        lastName: data.last_name,
      });

      this.logger.log(`User ${email} updated successfully`);
    } catch (error) {
      this.logger.error(
        `Error handling user.updated event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

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
      this.logger.error(
        `Error handling organization.updated event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async handleUserDeleted(data: { id: string }): Promise<void> {
    try {
      this.logger.log(`Processing user.deleted event for ${data.id}`);

      const existingUser = await this.userService.findUserByClerkId(data.id);

      if (!existingUser) {
        this.logger.warn(`User with Clerk ID ${data.id} not found`);
        return;
      }

      await this.userService.deleteUser(existingUser.id);

      this.logger.log(`User ${data.id} deleted successfully`);
    } catch (error) {
      this.logger.error(
        `Error handling user.deleted event: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  async handleOrganizationDeleted(data: { id: string }): Promise<void> {
    try {
      this.logger.log(`Processing organization.deleted event for ${data.id}`);

      const existingOrg = await this.prisma.organization.findUnique({
        where: { clerkOrganizationId: data.id },
      });

      if (!existingOrg) {
        this.logger.warn(`Organization with Clerk ID ${data.id} not found`);

        return;
      }

      await this.prisma.organization.delete({
        where: { id: existingOrg.id },
      });

      this.logger.log(`Organization ${data.id} deleted successfully`);
    } catch (error) {
      this.logger.error(
        `Error handling organization.deleted event: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
