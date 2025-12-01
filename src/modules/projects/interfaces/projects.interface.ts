import { Project, User } from 'src/generated/prisma/client';

export interface ProjectWithRelations extends Project {
  user: User;
}
