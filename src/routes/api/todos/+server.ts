import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const createTodoSchema = z.object({
	title: z.string().trim().min(1).max(500),
	priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P2')
});

const updateTodoSchema = z.object({
	completed: z.boolean().optional()
});

export const GET: RequestHandler = async ({ locals }) => {
	const { user } = await locals.getSession();
	if (!user) return json({ todos: [], backendReady: false });

	const { data, error } = await locals.supabase
		.from('todos')
		.select('*')
		.eq('completed', false)
		.eq('is_archived', false)
		.order('position', { ascending: true })
		.order('created_at', { ascending: false });

	if (error) return json({ message: 'Unable to load tasks.', backendReady: true }, { status: 500 });
	return json({ todos: data, backendReady: true });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const { user } = await locals.getSession();
	if (!user) return json({ message: 'Task storage is not configured.' }, { status: 503 });

	const parsed = createTodoSchema.safeParse(await request.json());
	if (!parsed.success) return json({ message: 'Enter a task title to continue.' }, { status: 400 });

	const { data, error } = await locals.supabase
		.from('todos')
		.insert({ owner_id: user.id, title: parsed.data.title, priority: parsed.data.priority, position: Date.now() })
		.select()
		.single();

	if (error) return json({ message: 'Unable to create that task.' }, { status: 500 });
	return json({ todo: data }, { status: 201 });
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	const { user } = await locals.getSession();
	if (!user) return json({ message: 'Task storage is not configured.' }, { status: 503 });

	const body = await request.json();
	const id = z.string().uuid().safeParse(body.id);
	const changes = updateTodoSchema.safeParse(body.changes);
	if (!id.success || !changes.success || Object.keys(changes.data).length === 0) {
		return json({ message: 'That task update is invalid.' }, { status: 400 });
	}

	const update = changes.data.completed ? { completed: true, completed_at: new Date().toISOString() } : { completed: false, completed_at: null };
	const { data, error } = await locals.supabase.from('todos').update(update).eq('id', id.data).eq('owner_id', user.id).select().single();
	if (error) return json({ message: 'Unable to update that task.' }, { status: 500 });
	return json({ todo: data });
};