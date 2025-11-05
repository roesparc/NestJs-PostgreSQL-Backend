export interface JwtPayload {
  userId: number;
  username: string;
}

export interface Login {
  access_token: string;
}
