export type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  scheduledDate: string | null;
  listOrder: number;
  calendarOrder: number;
  createdAt: string;
};
