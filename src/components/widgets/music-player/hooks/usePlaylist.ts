import type { Song, RepeatMode } from "../types";
import { LOCAL_PLAYLIST } from "../constants";
import { i18n } from "../../../../i18n/translation";
import Key from "../../../../i18n/i18nKey";

export interface PlaylistState {
	playlist: Song[];
	currentIndex: number;
	isShuffled: boolean;
	isRepeating: RepeatMode;
}

export function createPlaylistState(): PlaylistState {
	return {
		playlist: [],
		currentIndex: 0,
		isShuffled: false,
		isRepeating: 0,
	};
}

export function toggleShuffle(state: PlaylistState) {
	state.isShuffled = !state.isShuffled;
	if (state.isShuffled) {
		state.isRepeating = 0;
	}
}

export function toggleRepeat(state: PlaylistState) {
	state.isRepeating = ((state.isRepeating + 1) % 3) as RepeatMode;
	if (state.isRepeating !== 0) {
		state.isShuffled = false;
	}
}

export function previousSong(state: PlaylistState): number {
	if (state.playlist.length <= 1) return state.currentIndex;
	return state.currentIndex > 0
		? state.currentIndex - 1
		: state.playlist.length - 1;
}

export function nextSong(
	state: PlaylistState,
	autoPlay: boolean = true,
): number {
	if (state.playlist.length <= 1) return state.currentIndex;

	let newIndex: number;
	if (state.isShuffled) {
		do {
			newIndex = Math.floor(Math.random() * state.playlist.length);
		} while (newIndex === state.currentIndex && state.playlist.length > 1);
	} else {
		newIndex =
			state.currentIndex < state.playlist.length - 1
				? state.currentIndex + 1
				: 0;
	}
	return newIndex;
}

export function playSong(state: PlaylistState, index: number): boolean {
	if (index < 0 || index >= state.playlist.length) return false;
	state.currentIndex = index;
	return true;
}

export async function fetchMetingPlaylist(
	state: PlaylistState,
	meting_api: string,
	meting_server: string,
	meting_type: string,
	meting_id: string,
	onLoadStart: () => void,
	onLoadEnd: () => void,
	showError: (message: string) => void,
): Promise<void> {
	if (!meting_api || !meting_id) return;

	onLoadStart();
	const apiUrl = meting_api
		.replace(":server", meting_server)
		.replace(":type", meting_type)
		.replace(":id", meting_id)
		.replace(":auth", "")
		.replace(":r", Date.now().toString());

	try {
		const res = await fetch(apiUrl);
		if (!res.ok) throw new Error("meting api error");
		const list = await res.json();
		state.playlist = list.map((song: any) => {
			let title = song.name ?? song.title ?? i18n(Key.unknownSong);
			let artist = song.artist ?? song.author ?? i18n(Key.unknownArtist);
			let dur = song.duration ?? 0;
			if (dur > 10000) dur = Math.floor(dur / 1000);
			if (!Number.isFinite(dur) || dur <= 0) dur = 0;
			return {
				id: song.id,
				title,
				artist,
				cover: song.pic ?? "",
				url: song.url ?? "",
				duration: dur,
			};
		});
		onLoadEnd();
	} catch (e) {
		showError(i18n(Key.musicPlayerErrorPlaylist));
		onLoadEnd();
	}
}

export function loadLocalPlaylist(
	state: PlaylistState,
	showError: (message: string) => void,
): boolean {
	state.playlist = [...LOCAL_PLAYLIST];
	if (state.playlist.length === 0) {
		showError("本地播放列表为空");
		return false;
	}
	return true;
}

export function canSkip(state: PlaylistState): boolean {
	return state.playlist.length > 1;
}
