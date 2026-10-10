<script context="module" lang="ts">
	export interface DiaryUsage { total: number | null; input: number | null; cached: number | null; output: number | null; }
	export interface DiaryEntry { time: string; title: string; text: string; tokens?: DiaryUsage; }
	export interface DiaryDay { date: string; entries: DiaryEntry[]; preview?: boolean; }
</script>

<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	export let days: DiaryDay[] = [];
	export let today: string;
	let selected = days.at(-1)?.date ?? today;
	let month = selected.slice(0, 7);
	let entryIndex = 0;
	let turning = false;
	let backwards = false;
	let destination = selected;
	let petting = false;
	let reducedMotion = false;
	let copied = false;
	let copyTimer: ReturnType<typeof setTimeout> | undefined;
	let writing: HTMLDivElement;
	let book: HTMLDivElement;
	let changeTimer: ReturnType<typeof setTimeout> | undefined;
	let finishTimer: ReturnType<typeof setTimeout> | undefined;
	let petTimer: ReturnType<typeof setTimeout> | undefined;
	let pointer: { x: number; y: number; time: number; id: number } | null = null;
	const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
	const number = (value: number | null) => value === null ? "—" : `${(value / 1_000_000).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:3 })} M`;
	const parseDate = (date: string) => new Date(`${date}T00:00:00Z`);
	const readableDate = (date: string) => new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long", timeZone: "UTC" }).format(parseDate(date));
	const weekday = (date: string) => new Intl.DateTimeFormat("zh-CN", { weekday: "long", timeZone: "UTC" }).format(parseDate(date));
	function validDate(date: string) { return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(parseDate(date).getTime()) && parseDate(date).toISOString().slice(0, 10) === date; }
	function calendarCells(value: string): (string | null)[] {
		const [year, monthNumber] = value.split("-").map(Number);
		const offset = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
		const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
		return [...Array.from({ length: offset }, () => null), ...Array.from({ length: count }, (_, index) => `${value}-${String(index + 1).padStart(2, "0")}`)];
	}
	$: dates = days.filter((day) => day.entries.length).map((day) => day.date).sort();
	$: records = new Map(days.map((day) => [day.date, day]));
	$: entries = records.get(selected)?.entries ?? [];
	$: activeEntry = entries[entryIndex] ?? entries[0];
	$: previous = [...dates].reverse().find((date) => date < selected);
	$: next = dates.find((date) => date > selected);
	$: cells = calendarCells(month);
	$: pageIndex = dates.indexOf(selected);
	$: incoming = records.get(destination)?.entries[0];
	function commitDate(date: string) { selected = date; entryIndex = 0; copied = false; writing?.scrollTo({ top: 0 }); }
	function selectDate(date: string, forward = false) {
		if (turning || !validDate(date)) return;
		month = date.slice(0, 7);
		if (date === selected) return;
		destination = date; backwards = !forward && date < selected;
		if (reducedMotion) { commitDate(date); return; }
		turning = true;
		changeTimer = setTimeout(() => commitDate(date), 380);
		finishTimer = setTimeout(() => { turning = false; }, 800);
	}
	function shiftMonth(delta: number) { const [year, monthNumber] = month.split("-").map(Number); month = new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7); }
	function chooseEntry(index: number) { entryIndex = index; copied = false; writing?.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" }); }
	async function copyEntry() {
		if (!activeEntry) return;
		const text = `${activeEntry.title}\n\n${activeEntry.text}`;
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			const selection = window.getSelection();
			const ranges = selection ? Array.from({ length:selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : [];
			const focused = document.activeElement;
			const field = document.createElement("textarea");
			field.value = text;
			field.style.cssText = "position:fixed;left:-9999px;top:0";
			document.body.append(field);
			let success = false;
			try { field.select(); success = document.execCommand("copy"); }
			finally {
				field.remove();
				if (focused instanceof HTMLElement) focused.focus({ preventScroll:true });
				selection?.removeAllRanges();
				for (const range of ranges) selection?.addRange(range);
			}
			if (!success) return;
		}
		copied = true;
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => { copied = false; }, 1600);
	}
	function keyTurn(event: KeyboardEvent) {
		if (!window.getSelection()?.isCollapsed) return;
		if (event.target instanceof HTMLElement && event.target.closest("button, a, summary, input")) return;
		const target = event.key === "ArrowLeft" ? previous : event.key === "ArrowRight" ? next : undefined;
		if (target) { event.preventDefault(); selectDate(target); }
	}
	function startSwipe(event: PointerEvent) {
		pointer = null;
		if (event.pointerType !== "touch" || !event.isPrimary || event.button !== 0 || !window.getSelection()?.isCollapsed) return;
		if (event.target instanceof Element && event.target.closest("button, a, summary, .entry")) return;
		pointer = { x: event.clientX, y: event.clientY, time: Date.now(), id: event.pointerId };
	}
	function endSwipe(event: PointerEvent) {
		if (!pointer || pointer.id !== event.pointerId) return;
		const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y, duration = Date.now() - pointer.time;
		pointer = null;
		if (!window.getSelection()?.isCollapsed) return;
		if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.8 || duration > 1000) return;
		const target = dx < 0 ? next : previous;
		if (target) selectDate(target);
	}
	function tilt(event: PointerEvent) {
		if (event.pointerType !== "mouse" || reducedMotion || turning || !book) return;
		if (event.buttons || !window.getSelection()?.isCollapsed) return;
		if (event.target instanceof Element && event.target.closest("button, summary, .page-writing, .entry-index")) { resetTilt(); return; }
		const rect = book.getBoundingClientRect();
		book.style.setProperty("--rx", `${(0.5 - (event.clientY - rect.top) / rect.height) * 2.5}deg`);
		book.style.setProperty("--ry", `${((event.clientX - rect.left) / rect.width - 0.5) * 3}deg`);
	}
	function resetTilt() { book?.style.setProperty("--rx", "0deg"); book?.style.setProperty("--ry", "0deg"); }
	function pet() {
		if (petting || turning) return;
		petting = true;
		petTimer = setTimeout(() => { petting = false; }, 950);
		const target = next ?? dates[0];
		if (target && target !== selected) selectDate(target, true);
	}
	onMount(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)"); reducedMotion = media.matches;
		const updateMotion = () => { reducedMotion = media.matches; }; media.addEventListener("change", updateMotion);
		const date = new URLSearchParams(window.location.search).get("date");
		if (date && validDate(date)) { selected = date; month = date.slice(0, 7); }
		return () => media.removeEventListener("change", updateMotion);
	});
	onDestroy(() => { clearTimeout(changeTimer); clearTimeout(finishTimer); clearTimeout(petTimer); clearTimeout(copyTimer); });
</script>

<section class="diary-studio" aria-labelledby="diary-title">
	<header class="studio-heading"><h1 id="diary-title" class="sr-only">日记本</h1><button class="today-button" type="button" aria-label="跳转到今天" on:click={() => selectDate(today)} disabled={turning}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v4m8-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/><path d="M9 14h6v3H9z"/></svg></button></header>
	<div class="desk">
		<div class="book-stage">
			<div class="book-shadow" aria-hidden="true"></div>
			<div class="book-float">
				<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions (The reading region supports optional arrow-key navigation and retains normal tab order for its controls.) -->
				<div class="book" bind:this={book} class:turning class:backwards role="region" aria-label="日记本" tabindex="0" on:keydown={keyTurn} on:pointerdown={startSwipe} on:pointerup={endSwipe} on:pointercancel={() => { pointer = null; }} on:pointermove={tilt} on:pointerleave={resetTilt}>
					<div class="cover" aria-hidden="true"></div><div class="page-stack" aria-hidden="true"></div>
					<div class="spread">
						<aside class="left-page">
							<div class="date-mark"><time datetime={selected}><span>{selected.slice(0, 4)} / {selected.slice(5, 7)}</span><strong>{selected.slice(8)}</strong></time><span class="day-name">{weekday(selected)}</span></div>
							<nav class="entry-index" aria-label="当天日记">{#each entries as entry, index}<button type="button" class:active={index === entryIndex} on:click={() => chooseEntry(index)}><span class="index-time">{entry.time}</span><span>{entry.title}</span></button>{/each}</nav>
							<footer class="left-footer"><span>{pageIndex >= 0 ? String(pageIndex + 1).padStart(2, "0") : "—"}</span>{#if records.get(selected)?.preview}<span class="preview-mark">预览</span>{/if}</footer>
						</aside>
						<div class="right-page">
							<div class="page-writing" bind:this={writing} aria-live="polite" aria-atomic="true">
								{#if activeEntry}<article class="entry"><div class="entry-tools"><time datetime={`${selected}T${activeEntry.time}:00+08:00`}>{activeEntry.time}</time><button type="button" class="copy-entry" class:copied aria-label={copied ? "已复制" : "复制日记"} on:click={copyEntry}><svg viewBox="0 0 24 24" aria-hidden="true">{#if copied}<path d="m5 12 4 4L19 6"/>{:else}<path d="M9 9h11v11H9zM15 5V3H3v12h2"/>{/if}</svg></button></div><h2>{activeEntry.title}</h2><p>{activeEntry.text}</p>
									{#if activeEntry.tokens}<details class="usage"><summary><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg><span>{activeEntry.tokens.total === null ? "—" : number(activeEntry.tokens.total)} tokens</span><svg class="usage-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg></summary><dl><div><dt>输入</dt><dd>{number(activeEntry.tokens.input)}</dd></div><div><dt>其中缓存</dt><dd>{number(activeEntry.tokens.cached)}</dd></div><div><dt>输出</dt><dd>{number(activeEntry.tokens.output)}</dd></div></dl></details>{/if}
								</article>{:else}<div class="empty-page" aria-label="该日暂无日记"><span aria-hidden="true">—</span></div>{/if}
							</div>
							<footer class="right-footer"><time datetime={selected}>{selected.replaceAll("-", ".")}</time><span>{entries.length ? `${entryIndex + 1} / ${entries.length}` : "—"}</span></footer>
						</div><div class="gutter" aria-hidden="true"></div>
					</div>
					<div class="ribbon" aria-hidden="true"></div>
					<span class="cat-fold" aria-hidden="true"></span>
					{#if turning}<div class="flip-sheet" aria-hidden="true"><div class="sheet-face sheet-front"><span>{selected.replaceAll("-", ".")}</span><strong>{activeEntry?.title ?? ""}</strong><p>{activeEntry?.text ?? ""}</p></div><div class="sheet-face sheet-back"><span>{destination.slice(0, 7).replace("-", " / ")}</span><strong class="flip-date">{destination.slice(8)}</strong><p>{incoming?.title ?? ""}</p></div></div>{/if}
					<button class="page-corner corner-left" type="button" aria-label="上一日期" disabled={!previous || turning} on:click={() => previous && selectDate(previous)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 7-5 5 5 5"/></svg></button>
					<button class="page-corner corner-right" type="button" aria-label="下一日期" disabled={!next || turning} on:click={() => next && selectDate(next)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 7 5 5-5 5"/></svg></button>
					<button type="button" class="page-cat" class:petting aria-label="戳猫耳少女翻页" on:click={pet} disabled={turning}><img src="/assets/ai-diary/diary-corner.webp" alt="猫耳少女扒住书页角" width="512" height="512" draggable="false" /><span class="pet-heart heart-one" aria-hidden="true">♡</span><span class="pet-heart heart-two" aria-hidden="true">✧</span></button>
				</div>
			</div>
		</div>
		<aside class="calendar" aria-label="日记日历"><div class="calendar-binding" aria-hidden="true"><i></i><i></i></div>
			<header class="calendar-month"><button type="button" aria-label="上个月" on:click={() => shiftMonth(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 7-5 5 5 5"/></svg></button><h2>{month.replace("-", " / ")}</h2><button type="button" aria-label="下个月" on:click={() => shiftMonth(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 7 5 5-5 5"/></svg></button></header>
			<div class="weekdays">{#each weekdays as day}<span>{day}</span>{/each}</div>
			<div class="calendar-days">{#each cells as date}{#if date}<button type="button" class:has-note={!!records.get(date)?.entries.length} class:selected={date === selected} class:today={date === today} aria-pressed={date === selected} aria-label={`${readableDate(date)}${records.get(date)?.entries.length ? `，${records.get(date)!.entries.length} 条日记` : "，暂无日记"}`} title={readableDate(date)} disabled={turning} on:click={() => selectDate(date)}>{Number(date.slice(8))}</button>{:else}<span></span>{/if}{/each}</div>
		</aside>
	</div>
</section>

<style>
	.diary-studio {
		--ink:#384763; --muted:#8890a0; --paper:#fffdf5; --rule:#b3bfcc29; --navy:#3d5178; --gold:#ba9a5d;
		position:relative; isolation:isolate; container-type:inline-size; padding:26px 24px 66px;
		background:radial-gradient(ellipse at 30% 55%,#cdd9e845,transparent 64%),linear-gradient(135deg,#f4f1e9dd,#edf1f6dd);
		border-radius:22px; color:var(--ink); overflow:clip;
	}
	.studio-heading{display:flex; align-items:center; justify-content:space-between; margin:0 6px 74px; }h1{font-size:23px; font-weight:550; letter-spacing:3px; margin:0; }
	button{cursor:pointer; -webkit-tap-highlight-color:transparent; }button:disabled{cursor:default; }svg{width:20px; height:20px; fill:none; stroke:currentColor; stroke-width:1.4; stroke-linecap:round; stroke-linejoin:round; }
	.today-button{display:grid; place-items:center; color:var(--muted); width:36px; height:36px; border-radius:50%; background:#ffffff40; transition:background .2s,transform .2s; }.today-button:hover{background:#fff9; transform:translateY(-2px); }
	button:focus-visible,summary:focus-visible,.book:focus-visible{outline:2px solid var(--gold); outline-offset:4px; }
	.desk{display:grid; grid-template-columns:minmax(0,1fr) 210px; gap:27px; align-items:start; }.book-stage{position:relative; min-width:0; padding:9px 0 0; perspective:1800px; }
	.book-shadow{position:absolute; width:94%; height:32px; bottom:-34px; left:3%; border-radius:50%; background:#283b5b23; filter:blur(13px); animation:shadow-breathe 7s ease-in-out infinite; }.book-float{position:relative; animation:book-breathe 7s ease-in-out infinite; }
	.book{position:relative; padding:11px 12px 17px; perspective:1600px; transform-style:preserve-3d; transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)); transition:transform .35s ease-out; touch-action:pan-y; }
	.cover{position:absolute; inset:0 -3px -5px; border-radius:9px 15px 15px 9px; background:linear-gradient(105deg,#283b5d,#53688e 5%,#3d5178 9%,#354b71 93%,#60759a); box-shadow:inset 0 1px 1px #fff6,inset 0 -2px 2px #0c1b3880,0 3px 0 #293e61,0 9px 13px #263a5620; }.cover::after{content:""; position:absolute; inset:5px; border:1px solid #d9dce140; border-radius:5px 10px 10px 5px; }
	.page-stack{position:absolute; inset:13px 7px 8px; border-radius:3px 9px 9px 3px; background:repeating-linear-gradient(to bottom,#dfdbce 0 1px,#fbf8ed 1px 3px); box-shadow:0 2px 0 #aeb2b9,0 5px 0 -1px #eee9dc; transform:skewY(-.35deg); }
	.spread{position:relative; display:grid; grid-template-columns:42% 58%; height:510px; background:var(--paper); border-radius:4px 8px 8px 4px; box-shadow:0 1px 1px #72694c22; }.left-page,.right-page{position:relative; min-width:0; min-height:0; }
	.left-page{display:flex; flex-direction:column; padding:112px 25px 32px 27px; border-radius:4px 0 0 4px; background:linear-gradient(90deg,#e7e1d024,transparent 18%,transparent 75%,#756d4a0a); }.right-page{display:flex; flex-direction:column; padding:43px 26px 32px 30px; border-radius:0 8px 8px 0; background:linear-gradient(90deg,#7166460b,transparent 14%,transparent 93%,#e9e4d429); }
	.gutter{position:absolute; inset:0 auto 0 42%; width:28px; transform:translateX(-50%); background:linear-gradient(90deg,transparent,#86795312 30%,#554c2f20 48%,#fff8 52%,#7a6e4510 68%,transparent); pointer-events:none; z-index:3; }
	.date-mark{margin:0 0 28px; }.date-mark time{display:flex; flex-direction:column; }.date-mark time>span{font-size:11px; letter-spacing:2px; color:var(--muted); }.date-mark strong{font-family:Georgia,"Times New Roman",serif; font-size:75px; font-weight:400; line-height:1.3; letter-spacing:-3px; }.day-name{font-size:11px; color:var(--muted); letter-spacing:1px; }
	.entry-index{display:flex; flex-direction:column; gap:14px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:#aab3c044 transparent; }.entry-index button{display:flex; flex-direction:column; gap:5px; padding:0 0 0 10px; text-align:left; border-left:1px solid #a1aabc30; font-size:12px; line-height:1.8; background:none; color:var(--muted); transition:color .2s,border-color .2s,transform .2s; overflow-wrap:anywhere; }.entry-index .active{color:var(--ink); border-color:var(--gold); }.entry-index button:hover{color:var(--ink); transform:translateX(2px); }.index-time{font-size:9px; letter-spacing:1px; color:var(--muted); }
	.left-footer,.right-footer{font-size:9px; color:var(--muted); display:flex; justify-content:space-between; align-items:center; gap:8px; }.left-footer{margin-top:auto; padding-top:20px; }.preview-mark{font-size:8px; opacity:.65; }.right-footer{margin-top:18px; }.right-footer time{letter-spacing:1px; }
	.page-writing{flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; scrollbar-width:thin; scrollbar-color:#aab3c044 transparent; padding-right:3px; }.entry h2{font-size:19px; font-weight:550; line-height:1.7; margin:17px 0 22px; overflow-wrap:anywhere; }.entry>p{font-size:14px; line-height:2.2; white-space:pre-line; margin:0; overflow-wrap:anywhere; background:repeating-linear-gradient(transparent,transparent calc(2.2em - 1px),var(--rule) calc(2.2em - 1px),var(--rule) 2.2em); }
	.usage{margin-top:35px; font-size:10px; color:var(--muted); }.usage summary{display:flex; align-items:center; gap:7px; cursor:pointer; list-style:none; }.usage summary::-webkit-details-marker{display:none; }.usage svg{width:13px; height:13px; }.usage-chevron{margin-left:auto; transition:transform .2s; }.usage[open] .usage-chevron{transform:rotate(180deg); }.usage dl{display:grid; gap:7px; margin:16px 0 12px; }.usage dl div{display:flex; justify-content:space-between; gap:10px; }.usage dd{margin:0; }.empty-page{display:grid; place-items:center; height:100%; color:var(--muted); opacity:.3; }
	.ribbon{position:absolute; top:11px; right:27px; width:17px; height:46px; background:linear-gradient(90deg,#aa8250,#d5b678 50%,#ad8753); clip-path:polygon(0 0,100% 0,100% 100%,50% 83%,0 100%); z-index:2; }
	.page-corner{position:absolute; bottom:17px; width:47px; height:47px; background:none; color:var(--ink); z-index:5; display:grid; place-items:center; overflow:hidden; }.corner-left{left:12px; border-radius:0 0 0 4px; }.corner-right{right:12px; border-radius:0 0 8px; }
	.page-corner::before{content:""; position:absolute; width:48px; height:48px; background:linear-gradient(135deg,#ded9c8,var(--paper) 53%,#99907533 54%,transparent 59%); transform:translate(34px,34px) rotate(-90deg); transition:transform .28s; }.corner-left::before{transform:translate(-34px,34px); background:linear-gradient(225deg,#ded9c8,var(--paper) 53%,#99907533 54%,transparent 59%); }.page-corner:hover:enabled::before,.page-corner:focus-visible::before{transform:translate(10px,10px) rotate(-90deg); }.corner-left:hover:enabled::before,.corner-left:focus-visible::before{transform:translate(-10px,10px); }
	.page-corner svg{position:relative; width:17px; height:17px; opacity:.4; transition:opacity .2s,transform .2s; }.page-corner:hover:enabled svg{opacity:1; transform:translateY(-2px); }.page-corner:disabled{opacity:.12; }
	.page-cat{position:absolute; top:-75px; left:3px; width:260px; height:130px; padding:0; background:none; z-index:8; transform:rotate(-5deg); transform-origin:45% 70%; transition:transform .3s; filter:drop-shadow(0 7px 3px #34456a17); }.page-cat img{display:block; width:100%; height:100%; object-fit:contain; user-select:none; pointer-events:none; }.page-cat:hover{transform:rotate(-3deg) translateY(-3px); }.page-cat.petting{animation:cat-pet .9s ease-in-out; }
	.pet-heart{position:absolute; opacity:0; color:#cc8a96; pointer-events:none; font-size:17px; }.heart-one{top:25%; left:25%; }.heart-two{top:15%; left:48%; color:var(--gold); }.petting .pet-heart{animation:heart-rise .9s ease-out; }.petting .heart-two{animation-delay:.1s; }
	.flip-sheet{position:absolute; top:11px; right:12px; bottom:17px; width:calc((100% - 24px) * .58); transform-origin:left center; transform-style:preserve-3d; z-index:7; animation:flip-forward .8s cubic-bezier(.4,0,.2,1) both; pointer-events:none; }.sheet-face{position:absolute; inset:0; padding:43px 27px; background:var(--paper); backface-visibility:hidden; border-radius:0 8px 8px 0; overflow:hidden; box-shadow:inset 16px 0 28px #6b614314,2px 0 8px #5e543520; }.sheet-face>span{font-size:10px; color:var(--muted); letter-spacing:1px; }.sheet-face>strong{display:block; font-size:19px; font-weight:550; margin-top:22px; line-height:1.7; }.sheet-face>p{font-size:14px; line-height:2.2; white-space:pre-line; margin-top:22px; }.sheet-back{transform:rotateY(180deg); background:linear-gradient(90deg,#dfd8c615,var(--paper)); }.sheet-back .flip-date{font:75px/1.4 Georgia,serif; }.backwards .flip-sheet{right:auto; left:12px; width:calc((100% - 24px) * .42); transform-origin:right center; animation-name:flip-backward; }.backwards .sheet-face{border-radius:4px 0 0 4px; }
	.calendar{position:relative; background:linear-gradient(130deg,#fffef9,#f5f3ee); border:1px solid #d4d7de60; padding:29px 14px 19px; margin-top:25px; border-radius:5px 5px 9px 9px; transform:rotate(2deg); box-shadow:0 3px 0 -1px #e5e2d9,0 6px 0 -2px #f2efe5,0 10px 19px #3f4f6212; transition:transform .3s,box-shadow .3s; }.calendar:hover,.calendar:focus-within{transform:rotate(0) translateY(-3px); box-shadow:0 3px 0 -1px #e5e2d9,0 6px 0 -2px #f2efe5,0 16px 25px #3f4f6217; }.calendar-binding{position:absolute; top:-9px; left:0; right:0; display:flex; justify-content:space-around; padding:0 24px; }.calendar-binding i{width:5px; height:19px; border-radius:5px; background:linear-gradient(90deg,#6d7991,#b3bdca,#5e6c84); box-shadow:1px 1px 1px #1a2b4835; }
	.calendar-month{display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }.calendar-month h2{font-size:12px; font-weight:550; letter-spacing:1px; margin:0; }.calendar-month button{display:grid; place-items:center; background:none; color:var(--muted); padding:4px; border-radius:50%; }.calendar-month button:hover{background:#8496b514; }.calendar-month svg{width:15px; height:15px; }.weekdays,.calendar-days{display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:4px; }.weekdays{text-align:center; font-size:9px; color:var(--muted); margin-bottom:10px; }.calendar-days button{position:relative; aspect-ratio:1; font-size:10px; color:var(--muted); border:1px solid transparent; border-radius:50%; background:none; padding:0; transition:transform .2s,background .2s,color .2s; }.calendar-days button:hover:enabled{background:#8092b21a; transform:translateY(-2px); }.calendar-days .has-note{color:var(--ink); font-weight:600; }.calendar-days .has-note::after{content:""; position:absolute; width:3px; height:3px; border-radius:50%; background:var(--gold); bottom:1px; left:calc(50% - 1.5px); }.calendar-days .today{border-color:#b59b6a60; }.calendar-days .selected,.calendar-days .selected:hover:enabled{background:var(--navy); color:#fff; box-shadow:0 2px 4px #3a507b24; }.calendar-days .selected.has-note::after{background:#e6cea1; }.calendar-days button:disabled{opacity:.7; }
	@keyframes book-breathe{0%,100%{transform:translateY(0) rotate(-.7deg)}50%{transform:translateY(-5px) rotate(-.35deg)} }@keyframes shadow-breathe{0%,100%{transform:scaleX(1); opacity:1}50%{transform:scaleX(.95); opacity:.65} }@keyframes flip-forward{0%{transform:rotateY(0deg)}100%{transform:rotateY(-180deg)} }@keyframes flip-backward{0%{transform:rotateY(0deg)}100%{transform:rotateY(180deg)} }
	@keyframes cat-pet{0%,100%{transform:rotate(-5deg)}30%{transform:rotate(-1deg) translateY(-7px)}55%{transform:rotate(-7deg) translateY(-2px)}75%{transform:rotate(-3deg) translateY(-5px)} }@keyframes heart-rise{0%{opacity:0; transform:translateY(0) scale(.6)}25%{opacity:1}100%{opacity:0; transform:translateY(-45px) scale(1.2)} }
	:global(.dark) .diary-studio{--ink:#d2d9e7; --muted:#919eb3; --paper:#293141; --rule:#8199b415; --navy:#526994; --gold:#c4a974; background:radial-gradient(ellipse at 25% 55%,#394c6850,transparent 65%),linear-gradient(135deg,#222a37ee,#202b3bee); }:global(.dark) .calendar{background:linear-gradient(130deg,#323c4e,#293243); border-color:#91a1b121; box-shadow:0 3px 0 -1px #3c4656,0 6px 0 -2px #303a4b,0 10px 19px #0e172b30; }:global(.dark) .today-button{background:#60708a18; }:global(.dark) .page-stack{background:repeating-linear-gradient(to bottom,#4c5360 0 1px,#343d4e 1px 3px); box-shadow:0 2px 0 #292f3c,0 5px 0 -1px #394153; }:global(.dark) .gutter{background:linear-gradient(90deg,transparent,#0c152344 45%,#69799440 52%,transparent); }
	@container(max-width:700px){.desk{grid-template-columns:minmax(0,1fr); gap:42px; }.calendar{width:240px; max-width:100%; margin:0 3px 0 auto; }.spread{height:530px; }.book-stage{margin:0 5px; } }
	@container(max-width:430px){.spread{grid-template-columns:31% 69%; height:500px; }.gutter{left:31%; width:20px; }.left-page{padding:96px 11px 29px 13px; }.right-page{padding:60px 17px 29px 20px; }.date-mark strong{font-size:51px; }.date-mark time>span{font-size:8px; letter-spacing:.5px; }.day-name{font-size:9px; }.entry-index button{font-size:10px; padding-left:6px; }.index-time{font-size:8px; }.page-cat{width:195px; height:100px; top:-50px; left:-13px; }.entry h2{font-size:17px; margin:16px 0 19px; }.entry>p{font-size:14px; line-height:2.1; background:repeating-linear-gradient(transparent,transparent calc(2.1em - 1px),var(--rule) calc(2.1em - 1px),var(--rule) 2.1em); }.ribbon{right:23px; width:13px; height:37px; }.flip-sheet{width:calc((100% - 24px) * .69); }.backwards .flip-sheet{width:calc((100% - 24px) * .31); }.sheet-face{padding:60px 17px; }.sheet-face>strong{font-size:17px; }.sheet-face>p{font-size:14px; }.calendar{width:210px; }.left-footer,.right-footer{font-size:8px; }.preview-mark{font-size:7px; } }
	@media(max-width:480px){.diary-studio{padding:22px 12px 45px; border-radius:16px; }.studio-heading{margin-bottom:60px; }h1{font-size:21px; }.book-stage{margin:0; }.desk{gap:35px; }.spread{height:490px; }.calendar{margin-right:9px; } }
	@media(prefers-reduced-motion:reduce){.book-float,.book-shadow,.page-cat.petting,.petting .pet-heart{animation:none; }.book,.calendar,button,.page-cat{transition:none; } }
	.book-stage:hover .book-float,.book-stage:focus-within .book-float,.book-stage:hover .book-shadow,.book-stage:focus-within .book-shadow{animation-play-state:paused; }
	.sr-only{position:absolute; width:1px; height:1px; padding:0; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
	.studio-heading{justify-content:flex-start; margin-bottom:44px; }
	.left-page{padding-top:67px; }
	.page-cat{top:-90px; left:auto; right:-17px; width:130px; height:140px; transform:rotate(0); transform-origin:60% 74%; filter:drop-shadow(1px 3px 2px #34456a18); }
	.page-cat:hover{transform:rotate(-2deg) translateY(2px); }
	.ribbon{right:140px; top:11px; z-index:1; }
	.spread::after{content:""; position:absolute; top:0; right:0; border-top:27px solid #435b83; border-left:27px solid transparent; }
	.cat-fold{position:absolute; top:11px; right:12px; width:28px; height:28px; background:linear-gradient(135deg,#dcd8cd,var(--paper) 60%); clip-path:polygon(0 0,0 100%,100% 100%); filter:drop-shadow(-2px 2px 1px #423c3025); z-index:4; }
	@keyframes cat-pet{0%,100%{transform:rotate(0)}30%{transform:rotate(-5deg) translate(-5px,6px)}65%{transform:rotate(1deg) translateY(3px)} }
	@container(max-width:430px){.page-cat{width:105px; height:114px; top:-72px; right:-11px; }.left-page{padding-top:68px; }.right-page{padding-top:43px; }.ribbon{top:11px; right:111px; } }
	@media(max-width:480px){.studio-heading{margin-bottom:35px; } }
	.left-page,.right-page,.page-writing{touch-action:pan-y; }
	.entry-index,.page-writing{overflow-x:hidden; scrollbar-width:none; }
	.entry-index::-webkit-scrollbar,.page-writing::-webkit-scrollbar{display:none; }
	.entry-index button:hover{transform:none; }
	.entry-tools{display:flex; justify-content:space-between; align-items:center; gap:10px; }
	.entry-tools>time{font-size:10px; letter-spacing:1px; color:var(--muted); }
	.copy-entry{display:grid; place-items:center; width:28px; height:24px; margin-right:-3px; background:none; color:var(--muted); opacity:.6; }
	.copy-entry:hover,.copy-entry:focus-visible{opacity:1; }.copy-entry.copied{color:var(--gold); opacity:1; }.copy-entry svg{width:15px; height:15px; }
	.diary-studio{user-select:none; -webkit-user-select:none; }
	.entry h2,.entry>p,.usage dl{user-select:none; -webkit-user-select:none; cursor:default; }
	.diary-studio button,.date-mark,.left-footer,.right-footer{user-select:none; -webkit-user-select:none; }
</style>
