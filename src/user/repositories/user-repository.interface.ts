import { User, UserRole } from '@prisma/client';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface CreateUserDto {
  email: string;
  clerkUserId: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  organizationId?: string;
}

export interface UserRepository {
  createUser(createUserDto: CreateUserDto): Promise<User>;

  findUserById(id: string): Promise<User | null>;

  findUserByEmail(email: string): Promise<User | null>;

  findUserByClerkId(clerkUserId: string): Promise<User | null>;

  updateUser(id: string, data: Partial<User>): Promise<User>;

  deleteUser(id: string): Promise<void>;
}
