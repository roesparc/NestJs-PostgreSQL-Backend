import { Request } from 'express';
import { Role, User } from '@prisma/client';

export interface ReqUser extends Omit<User, 'hash'> {
  roles: Role[];
}

export interface RequestWithUser extends Request {
  user: ReqUser;
}
