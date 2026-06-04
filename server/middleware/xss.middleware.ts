import type { Request, Response, NextFunction } from "express";
import DOMPurify from "isomorphic-dompurify";

export const sanitizeDeep = (val: unknown): unknown => {
  if (typeof val === "string") {
    return DOMPurify.sanitize(val, {
      ALLOWED_TAGS: [
        "b",
        "i",
        "em",
        "strong",
        "a",
        "p",
        "br",
        "ul",
        "ol",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "span",
        "div",
        "u",
        "s",
        "blockquote",
        "code",
        "pre",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "class", "style", "title"],
    }).trim();
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeDeep);
  }
  if (val !== null && typeof val === "object") {
    const sanitizedObj: Record<string, unknown> = {};
    const objVal = val as Record<string, unknown>;
    for (const key in objVal) {
      if (Object.prototype.hasOwnProperty.call(objVal, key)) {
        sanitizedObj[key] = sanitizeDeep(objVal[key]);
      }
    }
    return sanitizedObj;
  }
  return val;
};

export const xssMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeDeep(req.body);
  }
  if (req.query && typeof req.query === "object") {
    const sanitizedQuery = sanitizeDeep(req.query) as Record<string, string>;
    for (const key in sanitizedQuery) {
      req.query[key] = sanitizedQuery[key];
    }
  }
  if (req.params && typeof req.params === "object") {
    const sanitizedParams = sanitizeDeep(req.params) as Record<string, string>;
    for (const key in sanitizedParams) {
      req.params[key] = sanitizedParams[key];
    }
  }
  next();
};
