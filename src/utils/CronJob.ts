import nodeCron from 'node-cron';
import prisma from './Prisma';
import moment from 'moment-timezone';

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

const getAutoCheckoutTime = (clockIn: Date, shiftStart?: Date, shiftEnd?: Date, tz = "Asia/Karachi"): Date => {
    const clockInMoment = moment(clockIn).tz(tz);

    if (!shiftEnd) {
        // fallback: end of day of clockIn
        return clockInMoment.clone().endOf("day").toDate();
    }

    const shiftEndTimeStr = moment(shiftEnd).tz(tz).format("HH:mm:ss");
    const shiftStartTimeStr = shiftStart ? moment(shiftStart).tz(tz).format("HH:mm:ss") : null;

    // Anchor shift times to the clock-in date
    let shiftStartOnClockIn = shiftStartTimeStr
        ? moment.tz(clockInMoment.format("YYYY-MM-DD") + " " + shiftStartTimeStr, tz)
        : null;

    let shiftEndOnClockIn = moment.tz(clockInMoment.format("YYYY-MM-DD") + " " + shiftEndTimeStr, tz);

    // If shift end is on or before shift start (overnight), push end to next day
    if (shiftStartOnClockIn && shiftEndOnClockIn.isSameOrBefore(shiftStartOnClockIn)) {
        shiftEndOnClockIn.add(1, "day");
    }

    // If no shiftStart provided and end is before clockIn, treat as next-day end
    if (!shiftStartOnClockIn && shiftEndOnClockIn.isBefore(clockInMoment)) {
        shiftEndOnClockIn.add(1, "day");
    }

    let autoCheckout = shiftEndOnClockIn.clone().second(0);

    // Safety: ensure checkout is not before clockIn
    if (autoCheckout.isBefore(clockInMoment)) {
        autoCheckout = clockInMoment.clone().add(1, "minute");
    }

    return autoCheckout.toDate();
};

// Separate function for the auto-checkout logic
export const runAutoCheckout = async () => {
    try {
        console.log("[AutoCheckoutCron] Running auto-checkout...");

        const todayStart = moment().tz("Asia/Karachi").startOf("day").toDate();
        const todayEnd = moment().tz("Asia/Karachi").endOf("day").toDate();

        const pendingAttendances = await prisma.attendance_records.findMany({
            where: {
                clock_out: null,
                clock_in: { gte: todayStart, lte: todayEnd },
                // do not rely on status here; we only exclude explicit AutoCheckout marker
                status: { not: "AutoCheckout" },
            },
            include: { employee: true },
        });

        for (const attendance of pendingAttendances) {
            try {
                if (!attendance.employee.shift_id) {
                    console.log(`[AutoCheckoutCron] Skipping employee ${attendance.employee_id} - no shift assigned.`);
                    continue;
                }

                const shift = await prisma.shifts.findUnique({
                    where: { id: attendance.employee.shift_id },
                });

                if (!shift) {
                    console.log(`[AutoCheckoutCron] Skipping employee ${attendance.employee_id} - shift not found.`);
                    continue;
                }

                const autoCheckoutTime = getAutoCheckoutTime(attendance.clock_in, shift.start_time ?? undefined, shift.end_time ?? undefined, "Asia/Karachi");

                // calculate total breaks between clock_in and computed checkout
                const breaks = await prisma.breaks.findMany({ where: { attendance_record_id: attendance.id } });
                let totalBreakMs = 0;
                for (const brk of breaks) {
                    if (brk.break_start && brk.break_end) {
                        const bStart = new Date(brk.break_start).getTime();
                        const bEnd = new Date(brk.break_end).getTime();
                        if (bEnd > bStart) totalBreakMs += (bEnd - bStart);
                    }
                }

                const clockInMillis = new Date(attendance.clock_in).getTime();
                const checkoutMillis = new Date(autoCheckoutTime).getTime();
                const net_working_minutes = Math.max(0, Math.floor((checkoutMillis - clockInMillis - totalBreakMs) / (1000 * 60)));

                await prisma.attendance_records.update({
                    where: { id: attendance.id },
                    data: {
                        clock_out: autoCheckoutTime,
                        net_working_minutes,
                        // intentionally do NOT change status - preserve whatever it was
                    },
                });

                console.log(`[AutoCheckoutCron] Auto-checked out employee ${attendance.employee_id} at ${autoCheckoutTime}`);
            } catch (errInner) {
                console.error(`[AutoCheckoutCron] Error processing attendance id=${attendance.id}:`, errInner);
            }
        }

        console.log("[AutoCheckoutCron] Finished processing auto checkouts.");
    } catch (err) {
        console.error("[AutoCheckoutCron] Error:", err);
    }
};

// Cron schedule at 9:00 PM daily (Asia/Karachi) for testing
export const autoCheckoutCron = cron.schedule(
    "15 21 * * *", // 21:00 (9 PM) daily
    async () => {
        await runAutoCheckout();
    },
    { timezone: "Asia/Karachi" }
);

// Uncomment this later to run at 9 AM daily
// export const autoCheckoutCron = cron.schedule(
//     "0 9 * * *", // 9:00 AM daily
//     async () => {
//         await runAutoCheckout();
//     },
//     { timezone: "Asia/Karachi" }
// );