import { FastifyRequest } from 'fastify';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ClerkSessionService } from '../services/clerk-session.service';

interface ClerkRequestAuth {
  userId: string | null;
  sessionId: string | null;
  getToken: () => Promise<string | null>;
}

interface AuthenticatedRequest extends FastifyRequest {
  auth?: ClerkRequestAuth;
  user?: any;
}

@Injectable()
export class ClerkGlobalGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private clerkSessionService: ClerkSessionService
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
    
    if (request.auth?.userId) {
      try {
        const user = await this.clerkSessionService.getUserByClerkId(request.auth.userId);
        
        request.user = user;
        
        return true;
      } catch (error) {
        console.error('Error getting user by Clerk ID:', error);

        return false;
      }
    }

    return false;
  }
}
