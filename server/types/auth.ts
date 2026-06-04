import type { DecodedIdToken } from "firebase-admin/auth";

export interface AuthUser extends DecodedIdToken {
  role: string;
  isAdmin: boolean;
  permissions?: string[];
}

import type { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
