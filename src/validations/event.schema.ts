import { z } from 'zod';

export const eventSchema = (() => {
  const currentDate = Date.now();
  const twelveHoursLater = currentDate + 43200000; // 12 hours in milliseconds
  const nextMonth = new Date().setMonth(new Date().getMonth() + 1);

  return z.object({
    name: z
      .string()
      .min(2, { message: 'Required length between 2 and 64' })
      .max(64, { message: 'Required length between 2 and 64' }),
    deadline: z
      .number()
      .min(twelveHoursLater, {
        message: 'Deadline must be at least 12 hours from now',
      })
      .max(nextMonth, { message: 'Deadline must be earlier than next month' }),
  });
})();
