import { Post, User } from '@prisma/client';

export interface PostWithRelations extends Post {
  author: User;
}

export interface GetPosts {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  items: Post[];
}
