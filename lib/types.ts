export type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  scheduledDate: string | null;
  createdAt: string;
};
