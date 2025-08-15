import { Controller, Get } from '@nestjs/common';
import type { User } from '@prisma/client';
import { UserService } from './user.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Get current user',
    description: 'Retrieves the current user based on the authenticated session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved current user.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user is not authenticated.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found - the user does not exist in the system.',
  })
  @Get('current')
  async getCurrentUser(@CurrentUser() user: User): Promise<User> {
    return this.userService.getCurrentUser(user.id);
  }
}
