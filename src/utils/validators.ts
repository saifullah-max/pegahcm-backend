export const validateShift = (data: any): string | null => {
  if (!data.name || typeof data.name !== 'string') {
    return 'Shift name is required and must be a string';
  }

  if (!data.start_time || !isValidTime(data.start_time)) {
    return 'Valid start time is required (format: HH:MM AM/PM or HH:MM)';
  }

  if (!data.end_time || !isValidTime(data.end_time)) {
    return 'Valid end time is required (format: HH:MM AM/PM or HH:MM)';
  }

  // Parse times to compare them (allow overnight shifts like 9pm-6am)
  const start_minutes = parseTimeToMinutes(data.start_time);
  const end_minutes = parseTimeToMinutes(data.end_time);

  if (start_minutes === end_minutes) {
    return 'Start time and end time cannot be the same';
  }

  if (data.description && typeof data.description !== 'string') {
    return 'Description must be a string';
  }

  return null;
};

// Validate time format (without date)
const isValidTime = (time: any): boolean => {
  if (typeof time !== 'string') return false;
  
  // Match formats: "10:00 AM", "10:00 PM", "2:30 PM" (12-hour) or "14:00" (24-hour)
  const time12HourRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM|am|pm)$/;
  const time24HourRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  
  return time12HourRegex.test(time.trim()) || time24HourRegex.test(time.trim());
};

// Convert time string to minutes since midnight for comparison
const parseTimeToMinutes = (time_str: string): number => {
  const parts = time_str.trim().split(" ");
  const timePart = parts[0];
  const modifier = parts[1]?.toUpperCase();

  const [hoursStr, minutesStr] = timePart.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr || "0", 10);

  // Handle 12-hour format with AM/PM
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}; 