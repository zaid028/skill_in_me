import { createSupabaseServerClient } from '$lib/server/supabase/client';
import { env } from '$env/dynamic/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
		event.locals.getSession = async () => ({ user: null });
		return resolve(event);
	}

	event.locals.supabase = createSupabaseServerClient(event);
	event.locals.getSession = async () => {
		const {
			data: { user }
		} = await event.locals.supabase.auth.getUser();
		if (user) return { user };

		const {
			data: { user: anonymousUser }
		} = await event.locals.supabase.auth.signInAnonymously();
		return { user: anonymousUser };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
	});
};