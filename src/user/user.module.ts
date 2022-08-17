import { Module } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [AuthService],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
