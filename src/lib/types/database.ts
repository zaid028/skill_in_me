export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			profiles: { Row: Profile; Insert: Partial<Profile> & Pick<Profile, 'id'>; Update: Partial<Profile> };
			lists: { Row: TodoList; Insert: Omit<TodoList, 'id' | 'created_at' | 'updated_at'>; Update: Partial<TodoList> };
			todos: { Row: Todo; Insert: Omit<Todo, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Todo> };
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: { priority: 'P1' | 'P2' | 'P3' | 'P4'; member_role: 'owner' | 'editor' | 'viewer' };
		CompositeTypes: Record<string, never>;
	};
};

export type Profile = {
	id: string;
	display_name: string | null;
	avatar_url: string | null;
	timezone: string;
	theme: 'light' | 'dark' | 'system';
	notification_preferences: Json;
	created_at: string;
	updated_at: string;
};

export type TodoList = {
	id: string;
	owner_id: string;
	name: string;
	color: string;
	is_archived: boolean;
	created_at: string;
	updated_at: string;
};

export type Todo = {
	id: string;
	owner_id: string;
	list_id: string | null;
	title: string;
	description: string | null;
	notes: string | null;
	priority: Database['public']['Enums']['priority'];
	due_at: string | null;
	completed_at: string | null;
	completed: boolean;
	is_archived: boolean;
	is_favorite: boolean;
	position: number;
	recurrence_rule: string | null;
	created_at: string;
	updated_at: string;
};