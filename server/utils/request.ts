import type { Request } from "express";
import type { AuthUser } from "../types/auth.ts";

export function getReqUser(req: Request): AuthUser {
  return req.user as AuthUser;
}
