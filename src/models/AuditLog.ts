import mongoose from '../utils/mongo';

const AuditLogSchema = new (mongoose as any).Schema(
  {
    actorId: { type: String },
    actorName: { type: String },
    actorEmail: { type: String },
    actorRole: { type: String },
    impersonatedBy: { type: String },
    method: { type: String, required: true },
    route: { type: String, required: true },
    module: { type: String },
    action: { type: String },
    resourceType: { type: String },
    resourceId: { type: String },
    statusCode: { type: Number },
    ip: { type: String },
    userAgent: { type: String },
    query: { type: Object },
    params: { type: Object },
    body: { type: Object },
    before: { type: Object },
    after: { type: Object },
    message: { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

AuditLogSchema.index({ route: 1, method: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ actorName: 1, createdAt: -1 });

const AuditLog = (mongoose as any).models.AuditLog || (mongoose as any).model('AuditLog', AuditLogSchema);
export default AuditLog;


