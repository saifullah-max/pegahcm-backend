import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';

const SENSITIVE_KEYS = ['password', 'password_hash', 'oldPassword', 'newPassword', 'token'];

function maskSensitive(obj: any) {
  try {
    const clone = JSON.parse(JSON.stringify(obj || {}));
    const mask = (o: any) => {
      if (!o || typeof o !== 'object') return;
      Object.keys(o).forEach((k) => {
        if (SENSITIVE_KEYS.includes(k)) {
          o[k] = '**redacted**';
        } else if (typeof o[k] === 'object') {
          mask(o[k]);
        }
      });
    };
    mask(clone);
    return clone;
  } catch {
    return {};
  }
}

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  const resAny = res as any;
  let finalizedOnce = false;

  const context = {
    method: req.method,
    route: req.originalUrl || req.url,
    actorId: (req.user as any)?.userId || undefined,
    actorName: (req.user as any)?.full_name || (req.user as any)?.username || undefined,
    actorEmail: (req.user as any)?.email || undefined,
    actorRole: (req.user as any)?.role || undefined,
    impersonatedBy: (req.user as any)?.impersonatedBy || undefined,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    query: maskSensitive(req.query),
    params: maskSensitive(req.params),
    body: maskSensitive(req.body),
  } as any;

  const shouldLog = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || /\/api\//.test(req.path);

  const finalize = (bodyPayload: any) => {
    if (finalizedOnce) return;
    finalizedOnce = true;
    const durationMs = Date.now() - start;
    // 1) Prefer actor from req.user (set by auth middleware on protected routes)
    const jwtUser = (req as any)?.user || undefined;
    const derivedFromJwt = jwtUser
      ? {
          actorId: jwtUser.userId,
          actorName: jwtUser.full_name || jwtUser.username,
          actorEmail: jwtUser.email,
          actorRole: jwtUser.role,
          impersonatedBy: jwtUser.impersonatedBy,
        }
      : {};

    // 2) Fallback: derive actor from successful login response when unauthenticated
    const responseUser = (bodyPayload && (bodyPayload as any).data && (bodyPayload as any).data.user)
      ? (bodyPayload as any).data.user
      : undefined;
    const derivedFromResponse = responseUser
      ? {
          actorId: responseUser.id,
          actorName: responseUser.full_name || responseUser.username,
          actorEmail: responseUser.email,
          actorRole: responseUser.role,
        }
      : {};

    const log = new (AuditLog as any)({
      ...context,
      ...derivedFromJwt,
      ...derivedFromResponse,
      statusCode: res.statusCode,
      message: `${context.method} ${context.route} ${res.statusCode} (${durationMs}ms)`,
      after: maskSensitive(bodyPayload),
    });
    // Fire-and-forget to not block response
    // Promise.resolve(log.save()).catch(() => {}); Commented out to not flood DB with testing logs
  };

  resAny.json = (data?: any) => {
    if (shouldLog) finalize(data);
    return originalJson(data);
  };

  resAny.send = (body?: any) => {
    if (shouldLog) finalize(body);
    return originalSend(body);
  };

  return next();
}


