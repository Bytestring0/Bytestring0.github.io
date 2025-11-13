<script lang="ts">
import { onDestroy, onMount } from "svelte";
import type { LifeCountdownHolidayConfig } from "../../types/config";

const MS_PER_DAY = 86_400_000;

export type LifeCountdownLabels = {
	today: string;
	week: string;
	month: string;
	year: string;
	remaining: string;
	completed: string;
	nextHoliday: string;
	holidayCountdown: string;
	noHoliday: string;
	day: string;
	hour: string;
	minute: string;
	second: string;
};

type ProgressSegment = {
	id: string;
	label: string;
	progress: number;
	remainingMs: number;
};

type ResolvedHoliday = {
	name: string;
	displayDate: string;
	remainingMs: number;
	daysLeft: number;
};

export let timezone: number = 8;
export let holidays: LifeCountdownHolidayConfig[] = [];
const defaultLabels: LifeCountdownLabels = {
	today: "Today",
	week: "Week",
	month: "Month",
	year: "Year",
	remaining: "Remaining",
	completed: "Completed",
	nextHoliday: "Next holiday",
	holidayCountdown: "Countdown",
	noHoliday: "No upcoming holiday",
	day: "d",
	hour: "h",
	minute: "m",
	second: "s",
};

export let labels: LifeCountdownLabels = defaultLabels;

let segments: ProgressSegment[] = [];
let nextHoliday: ResolvedHoliday | null = null;
let timer: ReturnType<typeof setInterval> | undefined;

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

const computeProgress = (startMs: number, endMs: number, tzNowMs: number) => {
	const duration = endMs - startMs;
	if (duration <= 0) {
		return { progress: 100, remainingMs: 0 };
	}

	const elapsed = clamp(tzNowMs - startMs, 0, duration);
	const remainingMs = Math.max(endMs - tzNowMs, 0);
	const percentage = clamp((elapsed / duration) * 100, 0, 100);

	return { progress: percentage, remainingMs };
};

const formatDuration = (ms: number) => {
	if (ms <= 0) {
		return labels.completed;
	}

	const totalSeconds = Math.floor(ms / 1_000);
	const days = Math.floor(totalSeconds / 86_400);
	const hours = Math.floor((totalSeconds % 86_400) / 3_600);
	const minutes = Math.floor((totalSeconds % 3_600) / 60);
	const seconds = totalSeconds % 60;

	const parts: string[] = [];

	if (days > 0) {
		parts.push(`${days}${labels.day}`);
	}
	if (hours > 0 && parts.length < 3) {
		parts.push(`${hours}${labels.hour}`);
	}
	if (minutes > 0 && parts.length < 3) {
		parts.push(`${minutes}${labels.minute}`);
	}
	if (parts.length === 0) {
		parts.push(`${seconds}${labels.second}`);
	}

	return parts.join(" ");
};

const parseHoliday = (
	holiday: LifeCountdownHolidayConfig,
	tzNowMs: number,
	currentYear: number,
): ResolvedHoliday | null => {
	if (!holiday.name || !holiday.date) {
		return null;
	}

	const isoMatch = holiday.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	const mdMatch = holiday.date.match(/^(\d{2})-(\d{2})$/);

	let targetYear = currentYear;
	let monthIndex: number | null = null;
	let dayValue: number | null = null;
	let targetMs: number | null = null;

	if (isoMatch) {
		targetYear = Number(isoMatch[1]);
		monthIndex = Number(isoMatch[2]) - 1;
		dayValue = Number(isoMatch[3]);
		targetMs = Date.UTC(targetYear, monthIndex, dayValue);

		if (targetMs < tzNowMs) {
			if (holiday.recurring) {
				targetYear += 1;
				targetMs = Date.UTC(targetYear, monthIndex, dayValue);
			} else {
				return null;
			}
		}
	} else if (mdMatch) {
		monthIndex = Number(mdMatch[1]) - 1;
		dayValue = Number(mdMatch[2]);
		targetMs = Date.UTC(targetYear, monthIndex, dayValue);

		if (targetMs < tzNowMs) {
			targetYear += 1;
			targetMs = Date.UTC(targetYear, monthIndex, dayValue);
		}
	} else {
		return null;
	}

	if (
		targetMs === null ||
		Number.isNaN(targetMs) ||
		monthIndex === null ||
		dayValue === null
	) {
		return null;
	}

	const remainingMs = targetMs - tzNowMs;

	if (remainingMs < 0) {
		return null;
	}

	const daysLeft = Math.max(Math.ceil(remainingMs / MS_PER_DAY), 0);
	const displayDate = `${targetYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(
		dayValue,
	).padStart(2, "0")}`;

	return {
		name: holiday.name,
		displayDate,
		remainingMs,
		daysLeft,
	};
};

const updateState = () => {
	const now = new Date();
	const offsetHours = Number.isFinite(timezone) ? Number(timezone) : 0;
	const diffMinutes = (offsetHours+8)%24 * 60 + now.getTimezoneOffset();
	const tzNowMs = now.getTime() + diffMinutes * 60_000;
	const tzDate = new Date(tzNowMs);

	const year = tzDate.getUTCFullYear();
	const month = tzDate.getUTCMonth();
	const date = tzDate.getUTCDate();
	const dayOfWeekSunday = tzDate.getUTCDay();
	const dayOfWeekMonday = (dayOfWeekSunday + 6) % 7;

	const startOfDayMs = Date.UTC(year, month, date);
	const endOfDayMs = Date.UTC(year, month, date + 1);
	const startOfWeekMs = startOfDayMs - dayOfWeekMonday * MS_PER_DAY;
	const endOfWeekMs = startOfWeekMs + 7 * MS_PER_DAY;
	const startOfMonthMs = Date.UTC(year, month, 1);
	const endOfMonthMs = Date.UTC(year, month + 1, 1);
	const startOfYearMs = Date.UTC(year, 0, 1);
	const endOfYearMs = Date.UTC(year + 1, 0, 1);

	const segmentDefinitions = [
		{
			id: "today",
			label: labels.today,
			start: startOfDayMs,
			end: endOfDayMs,
		},
		{
			id: "week",
			label: labels.week,
			start: startOfWeekMs,
			end: endOfWeekMs,
		},
		{
			id: "month",
			label: labels.month,
			start: startOfMonthMs,
			end: endOfMonthMs,
		},
		{
			id: "year",
			label: labels.year,
			start: startOfYearMs,
			end: endOfYearMs,
		},
	];

	segments = segmentDefinitions.map(({ id, label, start, end }) => {
		const { progress, remainingMs } = computeProgress(start, end, tzNowMs);
		return { id, label, progress, remainingMs };
	});

	const holidayList = Array.isArray(holidays) ? holidays : [];

	const resolvedHolidays = holidayList
		.map((holiday) => parseHoliday(holiday, tzNowMs, year))
		.filter((holiday): holiday is ResolvedHoliday => Boolean(holiday))
		.sort((a, b) => a.remainingMs - b.remainingMs);

	nextHoliday = resolvedHolidays[0] ?? null;
};

onMount(() => {
	updateState();
	timer = setInterval(updateState, 1_000);
});

onDestroy(() => {
	if (timer) {
		clearInterval(timer);
	}
});

$: if (!timer) {
	updateState();
}
</script>

<div class="flex flex-col gap-4">
	{#each segments as segment (segment.id)}
		<div class="flex flex-col gap-2">
			<div class="flex items-center justify-between text-sm font-medium text-neutral-700 dark:text-neutral-200">
				<span>{segment.label}</span>
				<span>{segment.progress.toFixed(1)}%</span>
			</div>
			<div class="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
				<div
					class="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
					style={`width: ${segment.progress.toFixed(1)}%`}
				></div>
			</div>
			<div class="text-xs text-neutral-500 dark:text-neutral-400">
				{#if segment.remainingMs > 0}
					{labels.remaining} {formatDuration(segment.remainingMs)}
				{:else}
					{labels.completed}
				{/if}
			</div>
		</div>
	{/each}

	<div class="h-px w-full bg-black/5 dark:bg-white/10"></div>

	{#if nextHoliday}
		<div class="flex flex-col gap-2 rounded-lg border border-black/5 bg-black/5 p-3 text-neutral-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-neutral-200">
			<div class="flex items-center justify-between text-sm font-medium">
				<span>{labels.nextHoliday}</span>
				<span>{nextHoliday.displayDate}</span>
			</div>
			<div class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
				{nextHoliday.name}
			</div>
			<div class="text-xs text-neutral-500 dark:text-neutral-400">
				{labels.holidayCountdown}: {nextHoliday.daysLeft}{labels.day} · {formatDuration(nextHoliday.remainingMs)}
			</div>
		</div>
	{:else}
		<div class="text-xs text-neutral-500 dark:text-neutral-400">
			{labels.noHoliday}
		</div>
	{/if}
</div>
