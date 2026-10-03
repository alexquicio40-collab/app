export type User = {
  id: number;
  name: string;
  username: string;
  rol?: string;
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  sessionToken?: string;
  user: User;
};
