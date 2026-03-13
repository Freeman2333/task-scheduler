import { getTasks } from '@/app/actions/tasks';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';

export default async function Home() {
  const tasks = await getTasks();

  return <ResponsiveLayout tasks={tasks} />;
}
