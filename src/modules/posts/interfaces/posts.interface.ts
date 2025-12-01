import { Post, User } from 'src/generated/prisma/client';

export interface PostWithRelations extends Post {
  author: User;
}
