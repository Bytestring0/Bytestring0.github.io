// 友情链接数据配置
// 用于管理友情链接页面的数据

export interface FriendItem {
	id: number;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags: string[];
}

// 友情链接数据
export const friendsData: FriendItem[] = [
	{
		id: 1,
		title: "Ikalovic@Hexo",
		imgurl: "https://lunereal.1kal0vic.top/images/avatar.jpg",
		desc: "loli赛高",
		siteurl: "https://lunereal.1kal0vic.top/",
		tags: ["Hexo", "Blog"],
	},
	{
		id: 2,
		title: "MetaVi - --BLOG",
		imgurl: "	https://metaviii.github.io/img/2.png",
		desc: "Add a touch of fantasy?",
		siteurl: "https://metaviii.github.io/",
		tags: ["Blog", "Hexo"],
	},
	{
		id: 3,
		title: "Home • JerryMain Island",
		imgurl: "https://jerrymain.top/_image?href=%2F_astro%2Favatar.BNMTrox7.png&w=828&h=828&f=webp",
		desc: "Stay stupid, Stay android.",
		siteurl: "https://jerrymain.top/",
		tags: ["Blog", "Personal"],
	},
];

// 获取所有友情链接数据
export function getFriendsList(): FriendItem[] {
	return friendsData;
}

// 获取随机排序的友情链接数据
export function getShuffledFriendsList(): FriendItem[] {
	const shuffled = [...friendsData];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
