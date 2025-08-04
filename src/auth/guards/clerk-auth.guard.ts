import { FastifyRequest } from 'fastify';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ClerkSessionService } from '../services/clerk-session.service';

interface AuthenticatedRequest extends FastifyRequest {
  user?: any;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private clerkSessionService: ClerkSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    try {
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException('No authorization header provided');
      }

      const [type, token] = authHeader.split(' ');

      if (type !== 'Bearer' || !token) {
        throw new UnauthorizedException('Invalid authorization header format');
      }

      const session = await this.clerkSessionService.validateSession(token);

      request['user'] = session.user;

      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);

      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
