export function filterByStatus(tasks, status) {
  return tasks.filter(t => t.status === status);
}
