import { Post, Project, Role, User } from '@prisma/client';

export interface UserWithoutHash extends Omit<User, 'hash'> {}

export interface UserWithRelations extends UserWithoutHash {
  roles: Role[];
  projects: Project[];
  Posts: Post[];
}

export interface UserProfile extends UserWithoutHash {
  roles: Role[];
}
