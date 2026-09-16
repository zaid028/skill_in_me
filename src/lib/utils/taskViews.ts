export type TaskState = {
	completed: boolean;
	isArchived?: boolean;
	isFavorite?: boolean;
	dueAt?: string | null;
};

export function getActiveTasks<T extends TaskState>(tasks: T[]) {
	return tasks.filter((task) => !task.completed && !task.isArchived);
}

export function getFavoriteTasks<T extends TaskState>(tasks: T[]) {
	return getActiveTasks(tasks).filter((task) => task.isFavorite);
}

export function getOverdueTasks<T extends TaskState>(tasks: T[], now = new Date()) {
	return getActiveTasks(tasks).filter((task) => task.dueAt && new Date(task.dueAt).getTime() < now.getTime());
}