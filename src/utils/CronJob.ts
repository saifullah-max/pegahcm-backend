import nodeCron from 'node-cron';
import prisma from './Prisma';
const cron = nodeCron;

// auto delete old notifications
export const startNotificationCleanupJob = () => {
    cron.schedule('0 1 * * *', async () => {
        try {
            const deletedCount = await prisma.userNotification.deleteMany({
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
        } catch (error) {
            console.error('Error deleting old notifications:', error);
        }
    })
}

