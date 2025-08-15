import { Injectable, Inject, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { USER_REPOSITORY } from './repositories/user-repository.interface';
import { CreateUserDto } from './repositories/user-repository.interface';
import type { UserRepository } from './repositories/user-repository.interface';
import { UserNotFoundException } from './exceptions/user.exceptions';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.userRepository.createUser(createUserDto);
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findUserById(id);

    if (!user) {
      throw new UserNotFoundException(id);
    }

    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findUserByEmail(email);
  }

  async findUserByClerkId(clerkUserId: string): Promise<User | null> {
    return this.userRepository.findUserByClerkId(clerkUserId);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.userRepository.updateUser(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    return this.userRepository.deleteUser(id);
  }

  async getCurrentUser(userId: string): Promise<User> {
    return this.findUserById(userId);
  }
}
