import mongoose from '../utils/mongo';

console.log('🟢 [AuditLog] Initializing model...');

if (!mongoose?.connection?.readyState) {
  console.error('🔴 [AuditLog] Mongoose not connected properly! readyState:', mongoose?.connection?.readyState);
} else {
  console.log('🟢 [AuditLog] Mongoose connected. Host:', mongoose?.connection?.host);
}

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

// Debug logs for schema initialization
AuditLogSchema.post('init', (doc: any) => {
  console.log('📄 [AuditLog] Document initialized:', doc._id);
});

AuditLogSchema.post('save', (doc: any) => {
  console.log('💾 [AuditLog] Document saved:', doc._id);
});

AuditLogSchema.post('error', (error: any, doc: any, next: any) => {
  console.error('❌ [AuditLog] Schema error:', error?.message || error);
  next(error);
});

let AuditLog: any;
try {
  AuditLog = (mongoose as any).models.AuditLog || (mongoose as any).model('AuditLog', AuditLogSchema);
  console.log('✅ [AuditLog] Model registered successfully');
} catch (err: any) {
  console.error('🚨 [AuditLog] Model registration failed:', err?.message);
}

export default AuditLog;
