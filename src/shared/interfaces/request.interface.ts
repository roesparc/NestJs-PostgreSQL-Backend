import { Request } from 'express';
import { UserWithoutHash } from 'src/modules/users/interfaces/users.interface';

export interface RequestWithUser extends Request {
  user: UserWithoutHash;
}
