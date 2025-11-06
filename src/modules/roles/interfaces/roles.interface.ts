import { Role, User } from "@prisma/client";

export interface RoleWithRelations extends Role {
  users: User[];
}
