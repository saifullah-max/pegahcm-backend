import nodeCron from 'node-cron';
import prisma from './Prisma';

const cron = nodeCron;

export const startCleanupJobs = () => {
    cron.schedule('0 1 * * *', async () => {
        try {
            // 1️⃣ Delete old notifications
            const deletedNotifications = await prisma.user_notifications.deleteMany({
                where: {
                    notification: {
                        created_at: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                    },
                    read: true,
                },
            });
            console.log(`Deleted ${deletedNotifications.count} old notifications`);

            // 2️⃣ Update closed tickets older than 2 weeks
            const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
            const updatedTickets = await prisma.tickets.updateMany({
                where: {
                    status: 'closed',
                    closed_at: { lt: twoWeeksAgo },
                },
                data: { status: 'deleted' },
            });
            console.log(`Updated ${updatedTickets.count} closed tickets to deleted`);
        } catch (error) {
            console.error('Error running cleanup jobs:', error);
        }
    });
};
