"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNotificationCleanupJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Prisma_1 = __importDefault(require("./Prisma"));
const cron = node_cron_1.default;
// auto delete old notifications
const startNotificationCleanupJob = () => {
    cron.schedule('0 1 * * *', async () => {
        try {
            const deletedCount = await Prisma_1.default.userNotification.deleteMany({
                where: {
                    notification: {
                        createdAt: {
                            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                    read: true,
                },
            });
            console.log(`Deleted ${deletedCount.count} old notifications`);
        }
        catch (error) {
            console.error('Error deleting old notifications:', error);
        }
    });
};
exports.startNotificationCleanupJob = startNotificationCleanupJob;
