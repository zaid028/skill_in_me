<script lang="ts">
	import {
		Archive,
		CalendarDays,
		Check,
		ChevronDown,
		Circle,
		Clock3,
		Inbox,
		LayoutGrid,
		MoreHorizontal,
		Plus,
		Search,
		Settings,
		Sparkles,
		Star,
		Tag,
		Users
	} from '@lucide/svelte';
	import { onMount } from 'svelte';

	type Task = {
		id: string | number;
		title: string;
		meta: string;
		priority: 'P1' | 'P2' | 'P3';
		completed: boolean;
		label?: string;
	};

	let newTask = $state('');
	let backendReady = $state(false);
	let activeView = $state('Today');
	let tasks = $state<Task[]>([
		{ id: 1, title: 'Review Q3 launch brief', meta: 'Today · 10:30 AM', priority: 'P1', completed: false, label: 'Work' },
		{ id: 2, title: 'Outline the onboarding flow', meta: 'Today · 2:00 PM', priority: 'P2', completed: false, label: 'Product' },
		{ id: 3, title: 'Reply to design feedback', meta: 'Today · 4:30 PM', priority: 'P2', completed: false, label: 'Work' },
		{ id: 4, title: 'Book a table for Saturday', meta: 'Today · 7:00 PM', priority: 'P3', completed: true }
	]);

	const navigation = [
		{ label: 'Inbox', icon: Inbox, count: 8 },
		{ label: 'Today', icon: CalendarDays, count: 4 },
		{ label: 'Upcoming', icon: Clock3 },
		{ label: 'Favorites', icon: Star }
	];

	onMount(async () => {
		try {
			const response = await fetch('/api/todos');
			if (!response.ok) return;
			const payload = await response.json();
			if (!payload.backendReady) return;
			backendReady = true;
			tasks = payload.todos.map((todo: { id: string; title: string; priority: Task['priority']; due_at: string | null; completed: boolean }) => ({
				id: todo.id,
				title: todo.title,
				meta: todo.due_at ? new Date(todo.due_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Today · Anytime',
				priority: todo.priority,
				completed: todo.completed
			}));
		} catch {
			// The local demo remains available when Supabase is not configured.
		}
	});

	async function addTask() {
		const title = newTask.trim();
		if (!title) return;
		if (backendReady) {
			const response = await fetch('/api/todos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, priority: 'P2' }) });
			if (!response.ok) return;
			const { todo } = await response.json();
			tasks = [{ id: todo.id, title: todo.title, meta: 'Today · Just now', priority: todo.priority, completed: false }, ...tasks];
		} else {
			tasks = [{ id: Date.now(), title, meta: 'Today · Just now', priority: 'P2', completed: false }, ...tasks];
		}
		newTask = '';
	}

	async function toggleTask(id: string | number) {
		const task = tasks.find((item) => item.id === id);
		if (backendReady && typeof id === 'string' && task) {
			const response = await fetch('/api/todos', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, changes: { completed: !task.completed } }) });
			if (!response.ok) return;
		}
		tasks = tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task));
	}

	let openTasks = $derived(tasks.filter((task) => !task.completed));
	let completedTasks = $derived(tasks.filter((task) => task.completed));
</script>

<svelte:head>
	<title>Daymark · Focus on what matters</title>
	<meta name="description" content="A calm, focused workspace for the things you want to get done." />
</svelte:head>

<div class="app-shell">
	<aside class="sidebar" aria-label="Primary navigation">
		<div class="brand"><span class="brand-mark"><Check size={15} strokeWidth={3} /></span><span>daymark</span></div>
		<div class="workspace-switcher"><div class="avatar">AM</div><div><strong>Alex Morgan</strong><span>Personal workspace</span></div><ChevronDown size={15} /></div>

		<nav class="nav-section" aria-label="Smart views">
			<span class="nav-label">Workspace</span>
			{#each navigation as item}
				{@const Icon = item.icon}
				<button class:active={activeView === item.label} class="nav-item" onclick={() => (activeView = item.label)}>
					<Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{#if item.count}<small>{item.count}</small>{/if}
				</button>
			{/each}
		</nav>

		<nav class="nav-section lists" aria-label="Lists">
			<div class="nav-label-row"><span class="nav-label">Lists</span><button class="icon-button" aria-label="Add list"><Plus size={16} /></button></div>
			<button class="nav-item"><span class="list-dot mint"></span><span>Product launch</span><small>12</small></button>
			<button class="nav-item"><span class="list-dot coral"></span><span>Personal</span><small>6</small></button>
			<button class="nav-item"><span class="list-dot amber"></span><span>Reading list</span></button>
		</nav>

		<div class="sidebar-footer"><button class="nav-item"><Tag size={17} /><span>Tags</span></button><button class="nav-item"><Settings size={17} /><span>Settings</span></button></div>
	</aside>

	<main class="main-content">
		<header class="topbar"><div class="breadcrumbs"><span>Workspace</span><span>/</span><strong>{activeView}</strong></div><div class="top-actions"><button class="search-trigger"><Search size={16} /><span>Search</span><kbd>⌘ K</kbd></button><button class="top-icon" aria-label="Shared workspace"><Users size={18} /></button><div class="avatar small">AM</div></div></header>

		<div class="content-wrap">
			<section class="page-heading"><div><p class="eyebrow">Tuesday, September 9</p><h1>{activeView}<span class="heading-dot">.</span></h1><p class="subtitle">A clear mind starts with a clear next step.</p></div><button class="primary-button" onclick={() => document.getElementById('quick-add')?.focus()}><Plus size={17} />Add task</button></section>

			<section class="quick-add" aria-label="Quick add task"><Sparkles size={18} /><input id="quick-add" bind:value={newTask} onkeydown={(event) => event.key === 'Enter' && addTask()} placeholder="What needs your attention?" /><button onclick={addTask}>Add task <span>↵</span></button></section>

			<div class="section-heading"><div><h2>Today <span>{openTasks.length}</span></h2><p>Tuesday · September 9, 2026</p></div><div class="section-actions"><button class="filter-button"><LayoutGrid size={15} />Focus view</button><button class="icon-button" aria-label="More options"><MoreHorizontal size={18} /></button></div></div>

			<section class="task-list" aria-label="Today's tasks">
				{#each openTasks as task (task.id)}
					<article class="task-row"><button class="task-check" class:done={task.completed} aria-label={`Complete ${task.title}`} onclick={() => toggleTask(task.id)}>{#if task.completed}<Check size={13} />{:else}<Circle size={18} />{/if}</button><div class="task-copy"><h3>{task.title}</h3><div class="task-meta"><span>{task.meta}</span>{#if task.label}<span class="task-label">{task.label}</span>{/if}</div></div><span class:high={task.priority === 'P1'} class:medium={task.priority === 'P2'} class="priority">{task.priority}</span><button class="row-more" aria-label={`More options for ${task.title}`}><MoreHorizontal size={17} /></button></article>
				{:else}<div class="empty-state"><Check size={22} /><h3>Everything is clear</h3><p>Enjoy the space, or add something new.</p></div>{/each}
			</section>

			{#if completedTasks.length}
				<div class="completed-heading"><Check size={15} /><span>Completed · {completedTasks.length}</span><button>View history</button></div>
				{#each completedTasks as task (task.id)}<article class="task-row completed-row"><button class="task-check done" aria-label={`Restore ${task.title}`} onclick={() => toggleTask(task.id)}><Check size={13} /></button><div class="task-copy"><h3>{task.title}</h3><div class="task-meta"><span>{task.meta}</span></div></div></article>{/each}
			{/if}

			<section class="focus-card"><div class="focus-icon"><Archive size={18} /></div><div><span class="card-kicker">Weekly rhythm</span><h2>Small steps, steady progress.</h2><p>You've completed 18 tasks this week. Keep the momentum gentle.</p></div><div class="progress-ring"><strong>72%</strong><span>on track</span></div></section>
		</div>
	</main>
</div>
