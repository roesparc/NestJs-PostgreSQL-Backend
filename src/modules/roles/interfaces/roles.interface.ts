import { Role, User } from 'src/generated/prisma/client';

export interface RoleWithRelations extends Role {
  users: User[];
}
