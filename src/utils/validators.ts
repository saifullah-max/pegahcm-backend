export const validateShift = (data: any): string | null => {
  if (!data.name || typeof data.name !== 'string') {
    return 'Shift name is required and must be a string';
  }

  if (!data.start_time || !isValidDate(data.start_time)) {
    return 'Valid start time is required';
  }

  if (!data.end_time || !isValidDate(data.end_time)) {
    return 'Valid end time is required';
  }

  const start_time = new Date(data.start_time);
  const end_time = new Date(data.end_time);

  if (start_time >= end_time) {
    return 'End time must be after start time';
  }

  if (data.description && typeof data.description !== 'string') {
    return 'Description must be a string';
  }

  return null;
};

const isValidDate = (date: any): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}; 