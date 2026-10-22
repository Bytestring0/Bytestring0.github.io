<script lang="ts">
import { onMount } from "svelte";

import I18nKey from "../i18n/i18nKey";
import { i18n } from "../i18n/translation";

export let tags: string[];
export let categories: string[];
export let sortedPosts: Post[] = [];

const params = new URLSearchParams(window.location.search);
tags = params.has("tag") ? params.getAll("tag") : [];
categories = params.has("category") ? params.getAll("category") : [];
const uncategorized = params.get("uncategorized");

interface Post {
	id: string;
	url?: string;
	data: {
		title: string;
		tags: string[];
		category?: string;
		published: Date;
		alias?: string;
		permalink?: string;
	};
}

interface Group {
	year: number;
	posts: Post[];
}

let groups: Group[] = [];
let total = 0;

function formatDate(date: Date) {
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${month}-${day}`;
}

function formatTag(tagList: string[]) {
	return tagList.map((t) => `#${t}`).join(" ");
}

onMount(async () => {
	let filteredPosts: Post[] = sortedPosts;

	if (tags.length > 0) {
		filteredPosts = filteredPosts.filter(
			(post) =>
				Array.isArray(post.data.tags) &&
				post.data.tags.some((tag) => tags.includes(tag)),
		);
	}

	if (categories.length > 0) {
		filteredPosts = filteredPosts.filter(
			(post) => post.data.category && categories.includes(post.data.category),
		);
	}

	if (uncategorized) {
		filteredPosts = filteredPosts.filter((post) => !post.data.category);
	}

	filteredPosts = filteredPosts
		.slice()
		.sort((a, b) => b.data.published.getTime() - a.data.published.getTime());

	const grouped = filteredPosts.reduce(
		(acc, post) => {
			const year = post.data.published.getFullYear();
			if (!acc[year]) acc[year] = [];
			acc[year].push(post);
			return acc;
		},
		{} as Record<number, Post[]>,
	);

	const groupedPostsArray = Object.keys(grouped).map((yearStr) => ({
		year: Number.parseInt(yearStr, 10),
		posts: grouped[Number.parseInt(yearStr, 10)],
	}));

	groupedPostsArray.sort((a, b) => b.year - a.year);
	total = filteredPosts.length;
	groups = groupedPostsArray;
});
</script>

<div class="archive-panel">
	<div class="archive-summary">
		<span class="eyebrow">Archive</span>
		<span class="archive-count">{total} 篇</span>
	</div>

	{#each groups as group}
		<section class="archive-year">
			<h2>{group.year}</h2>
			<ul>
				{#each group.posts as post}
					<li>
						<a href={post.url || `/posts/${post.id}/`} aria-label={post.data.title}>
							<span class="archive-date">{formatDate(post.data.published)}</span>
							<span class="archive-title">{post.data.title}</span>
							<span class="archive-tags">{formatTag(post.data.tags)}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.archive-panel {
		padding: 0.5rem 0 1rem;
	}

	.archive-summary {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgb(var(--n-4));
	}

	.eyebrow {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgb(var(--n-7));
	}

	.archive-count {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: rgb(var(--n-7));
		font-variant-numeric: tabular-nums;
	}

	.archive-year {
		padding-top: 2rem;
	}

	.archive-year h2 {
		margin: 0 0 0.5rem;
		font-family: var(--font-serif);
		font-size: 1.5rem;
		font-weight: 500;
		letter-spacing: -0.02em;
		color: rgb(var(--n-10));
		font-variant-numeric: tabular-nums;
	}

	.archive-year ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.archive-year li + li {
		border-top: 1px solid rgb(var(--n-4));
	}

	.archive-year a {
		display: grid;
		grid-template-columns: 3.5rem minmax(0, 1fr) minmax(0, 14rem);
		align-items: baseline;
		gap: 1rem;
		padding: 0.62rem 0.35rem;
		transition: background-color 150ms var(--ease);
	}

	.archive-year a:hover {
		background: rgb(var(--n-1) / 0.7);
	}

	.archive-date {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: rgb(var(--n-7));
		font-variant-numeric: tabular-nums;
	}

	.archive-title {
		font-size: 0.9rem;
		color: rgb(var(--n-9));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: color 150ms var(--ease);
	}

	.archive-year a:hover .archive-title {
		color: rgb(var(--accent));
	}

	.archive-tags {
		font-size: 0.7rem;
		color: rgb(var(--n-6));
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 768px) {
		.archive-year a {
			grid-template-columns: 3rem minmax(0, 1fr);
			gap: 0.7rem;
		}

		.archive-tags {
			display: none;
		}
	}
</style>
