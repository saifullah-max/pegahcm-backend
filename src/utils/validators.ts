export const validateShift = (data: any): string | null => {
  if (!data.name || typeof data.name !== 'string') {
    return 'Shift name is required and must be a string';
  }

  if (!data.startTime || !isValidDate(data.startTime)) {
    return 'Valid start time is required';
  }

  if (!data.endTime || !isValidDate(data.endTime)) {
    return 'Valid end time is required';
  }

  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  if (startTime >= endTime) {
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