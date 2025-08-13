import { Injectable, Logger } from '@nestjs/common';
import { clerkClient } from '@clerk/fastify';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { 
  InvalidSessionException,
  UserNotFoundException 
} from '../exceptions/auth.exceptions';

@Injectable()
export class ClerkSessionService {
  private readonly logger = new Logger(ClerkSessionService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async validateSession(clerkUserId: string) {
    try {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      
      if (!clerkUser) {
        throw new InvalidSessionException('Invalid user ID');
      }
      
      const session = { 
        sub: clerkUserId,
        primaryEmailAddress: clerkUser.emailAddresses.find(email => 
          email.id === clerkUser.primaryEmailAddressId)?.emailAddress
      };

      const user = await this.prisma.user.findUnique({
        where: { clerkUserId: session.sub },
        include: {
          organization: true,
        },
      });

      if (!user) {
        this.logger.warn(`User with clerkUserId ${session.sub} not found in database`);

        throw new UserNotFoundException(session.sub);
      }

      return { 
        session, 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
          organization: user.organization
        }
      };
    } catch (error) {
      this.logger.error(`Failed to validate session: ${error.message}`);

      throw error;
    }
  }

  async getUserByClerkId(clerkUserId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkUserId },
        include: {
          organization: true,
        },
      });

      return user;
    } catch (error) {
      this.logger.error(`Failed to get user: ${error.message}`);

      throw error;
    }
  }
}
