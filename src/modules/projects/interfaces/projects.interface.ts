import { Project, User } from '@prisma/client';

export interface ProjectWithRelations extends Project {
  user: User;
}
