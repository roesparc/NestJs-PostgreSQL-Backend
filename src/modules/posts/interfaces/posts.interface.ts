import { Post, User } from '@prisma/client';

export interface PostWithRelations extends Post {
  author: User;
}
