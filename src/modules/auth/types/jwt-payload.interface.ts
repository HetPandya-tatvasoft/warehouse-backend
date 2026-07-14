export interface IAccessTokenPayload {
  sub: string;
  email: string;
  roles: string[];
  tenantId: string | null;
}

export interface IRefreshTokenPayload {
  sub: string;
  tokenId: string;
}

export interface ICurrentUserData {
  userId: string;
  email: string;
  roles: string[];
  tenantId: string | null;
}
