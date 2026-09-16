import { describe, expect, it } from 'vitest';
import { getActiveTasks, getFavoriteTasks, getOverdueTasks } from '../../src/lib/utils/taskViews';

const tasks = [
	{ id: 1, completed: false, isFavorite: true, dueAt: '2026-09-08T09:00:00Z' },
	{ id: 2, completed: false, isArchived: true, isFavorite: true },
	{ id: 3, completed: true, isFavorite: true },
	{ id: 4, completed: false, isFavorite: false, dueAt: '2026-09-10T09:00:00Z' }
];

describe('task smart views', () => {
	it('excludes completed and archived tasks from active views', () => {
		expect(getActiveTasks(tasks).map((task) => task.id)).toEqual([1, 4]);
	});

	it('keeps only active favorites', () => {
		expect(getFavoriteTasks(tasks).map((task) => task.id)).toEqual([1]);
	});

	it('uses the supplied clock for overdue tasks', () => {
		expect(getOverdueTasks(tasks, new Date('2026-09-09T12:00:00Z')).map((task) => task.id)).toEqual([1]);
	});
});