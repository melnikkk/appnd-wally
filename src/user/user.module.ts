import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { USER_REPOSITORY } from './repositories/user-repository.interface';
import { PrismaUserRepository } from './repositories/prisma-user.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
