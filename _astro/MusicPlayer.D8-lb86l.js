import{o as Ia,a as Ra,i as Na}from"./lifecycle.D-a_Ig5y.js";import{$ as Wa,a8 as Oa,aI as Ya,aJ as qa,aK as Pe,u as ze,aL as Ka,ac as $e,aM as Ua,U as Ie,aN as mt,a5 as Ha,aO as Xa,c as rt,f as V,a as W,p as Ga,b as Ja,s as u,m as B,ak as q,g as t,d as dt,h as v,e as s,r as i,n as Va,t as Mt}from"./template.JYqKqMtV.js";import{a as Qa,s as X}from"./render.CXuEbr0L.js";import{i as z}from"./if.DIX_sNMd.js";import{e as Za,i as tr}from"./each.I_NqvLsJ.js";import{a as O,s as it,c as Te}from"./props.uPjqpyzo.js";import{e as y}from"./utils.BZWBu9i8.js";import{I as f}from"./Icon.GHMLolCl.js";import{m as ht}from"./config.BbucqMTB.js";import{I as er}from"./zh_TW.B6TQvt9k.js";import{i as ar}from"./translation.D5lQc9Qi.js";const rr=()=>performance.now(),G={tick:l=>requestAnimationFrame(l),now:()=>rr(),tasks:new Set};function Re(){const l=G.now();G.tasks.forEach(r=>{r.c(l)||(G.tasks.delete(r),r.f())}),G.tasks.size!==0&&G.tick(Re)}function ir(l){let r;return G.tasks.size===0&&G.tick(Re),{promise:new Promise(b=>{G.tasks.add(r={c:l,f:b})}),abort(){G.tasks.delete(r)}}}function St(l,r){$e(()=>{l.dispatchEvent(new CustomEvent(r))})}function sr(l){if(l==="float")return"cssFloat";if(l==="offset")return"cssOffset";if(l.startsWith("--"))return l;const r=l.split("-");return r.length===1?r[0]:r[0]+r.slice(1).map(b=>b[0].toUpperCase()+b.slice(1)).join("")}function Me(l){const r={},b=l.split(";");for(const F of b){const[_,p]=F.split(":");if(!_||p===void 0)break;const $=sr(_.trim());r[$]=p.trim()}return r}const nr=l=>l;function lr(l,r,b,F){var _=(l&Ka)!==0,p="both",$,w=r.inert,L=r.style.overflow,d,g;function D(){return $e(()=>$??=b()(r,F?.()??{},{direction:p}))}var A={is_global:_,in(){r.inert=w,St(r,"introstart"),d=Qt(r,D(),g,1,()=>{St(r,"introend"),d?.abort(),d=$=void 0,r.style.overflow=L})},out(S){r.inert=!0,St(r,"outrostart"),g=Qt(r,D(),d,0,()=>{St(r,"outroend"),S?.()})},stop:()=>{d?.abort(),g?.abort()}},T=Wa;if((T.transitions??=[]).push(A),Qa){var M=_;if(!M){for(var c=T.parent;c&&(c.f&Oa)!==0;)for(;(c=c.parent)&&(c.f&Ya)===0;);M=!c||(c.f&qa)!==0}M&&Pe(()=>{ze(()=>A.in())})}}function Qt(l,r,b,F,_){var p=F===1;if(Ua(r)){var $,w=!1;return Ie(()=>{if(!w){var S=r({direction:p?"in":"out"});$=Qt(l,S,b,F,_)}}),{abort:()=>{w=!0,$?.abort()},deactivate:()=>$.deactivate(),reset:()=>$.reset(),t:()=>$.t()}}if(b?.deactivate(),!r?.duration)return _(),{abort:mt,deactivate:mt,reset:mt,t:()=>F};const{delay:L=0,css:d,tick:g,easing:D=nr}=r;var A=[];if(p&&b===void 0&&(g&&g(0,1),d)){var T=Me(d(0,1));A.push(T,T)}var M=()=>1-F,c=l.animate(A,{duration:L,fill:"forwards"});return c.onfinish=()=>{c.cancel();var S=b?.t()??1-F;b?.abort();var x=F-S,Q=r.duration*Math.abs(x),Z=[];if(Q>0){var I=!1;if(d)for(var m=Math.ceil(Q/16.666666666666668),k=0;k<=m;k+=1){var a=S+x*D(k/m),J=Me(d(a,1-a));Z.push(J),I||=J.overflow==="hidden"}I&&(l.style.overflow="hidden"),M=()=>{var U=c.currentTime;return S+x*D(U/Q)},g&&ir(()=>{if(c.playState!=="running")return!1;var U=M();return g(U,1-U),!0})}c=l.animate(Z,{duration:Q,fill:"forwards"}),c.onfinish=()=>{M=()=>F,g?.(F,1-F),_()}},{abort:()=>{c&&(c.cancel(),c.effect=null,c.onfinish=mt)},deactivate:()=>{_=mt},reset:()=>{F===0&&g?.(1,0)},t:()=>M()}}function Se(l,r){return l===r||l?.[Xa]===r}function je(l={},r,b,F){return Pe(()=>{var _,p;return Ha(()=>{_=p,p=[],ze(()=>{l!==b(...p)&&(r(l,...p),_&&Se(b(..._),l)&&r(null,..._))})}),()=>{Ie(()=>{p&&Se(b(...p),l)&&r(null,...p)})}}),l}function De(l){return function(...r){var b=r[0];return b.stopPropagation(),l?.apply(this,r)}}function or(l){const r=l-1;return r*r*r+1}function ur(l,{delay:r=0,duration:b=400,easing:F=or,axis:_="y"}={}){const p=getComputedStyle(l),$=+p.opacity,w=_==="y"?"height":"width",L=parseFloat(p[w]),d=_==="y"?["top","bottom"]:["left","right"],g=d.map(x=>`${x[0].toUpperCase()}${x.slice(1)}`),D=parseFloat(p[`padding${g[0]}`]),A=parseFloat(p[`padding${g[1]}`]),T=parseFloat(p[`margin${g[0]}`]),M=parseFloat(p[`margin${g[1]}`]),c=parseFloat(p[`border${g[0]}Width`]),S=parseFloat(p[`border${g[1]}Width`]);return{delay:r,duration:b,easing:F,css:x=>`overflow: hidden;opacity: ${Math.min(x*20,1)*$};${w}: ${x*L}px;padding-${d[0]}: ${x*D}px;padding-${d[1]}: ${x*A}px;margin-${d[0]}: ${x*T}px;margin-${d[1]}: ${x*M}px;border-${d[0]}-width: ${x*c}px;border-${d[1]}-width: ${x*S}px;min-${w}: 0`}}var cr=dt('<div class="fixed bottom-20 right-4 z-[60] max-w-sm"><div class="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"><!> <span class="text-sm flex-1"> </span> <button class="text-white/80 hover:text-white transition-colors"><!></button></div></div>'),dr=dt('<div class="flex space-x-0.5"><div class="w-0.5 h-3 bg-white rounded-full animate-pulse"></div> <div class="w-0.5 h-4 bg-white rounded-full animate-pulse" style="animation-delay: 150ms;"></div> <div class="w-0.5 h-2 bg-white rounded-full animate-pulse" style="animation-delay: 300ms;"></div></div>'),vr=dt('<span class="text-sm text-[var(--content-meta)]"></span>'),fr=dt('<div role="button" tabindex="0"><div class="w-6 h-6 flex items-center justify-center"><!></div> <div class="w-10 h-10 rounded-lg overflow-hidden bg-[var(--btn-regular-bg)] flex-shrink-0"><img class="w-full h-full object-cover"/></div> <div class="flex-1 min-w-0"><div> </div> <div> </div></div></div>'),pr=dt('<div class="playlist-panel float-panel fixed bottom-20 right-4 w-80 max-h-96 overflow-hidden z-50"><div class="playlist-header flex items-center justify-between p-4 border-b border-[var(--line-divider)]"><h3 class="text-lg font-semibold text-90"> </h3> <button class="btn-plain w-8 h-8 rounded-lg"><!></button></div> <div class="playlist-content overflow-y-auto max-h-80"></div></div>'),mr=dt(`<!> <div><div role="button" tabindex="0" aria-label="显示音乐播放器"><!></div> <div role="button" tabindex="0" aria-label="展开音乐播放器"><div class="flex items-center gap-3 cursor-pointer"><div class="cover-container relative w-12 h-12 rounded-full overflow-hidden"><img alt="封面"/> <div class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><!></div></div> <div class="flex-1 min-w-0"><div class="text-sm font-medium text-90 truncate"> </div> <div class="text-xs text-50 truncate"> </div></div> <div class="flex items-center gap-1"><button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center" title="隐藏播放器"><!></button> <button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"><!></button></div></div></div> <div><div class="flex items-center gap-4 mb-4"><div class="cover-container relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0"><img alt="封面"/></div> <div class="flex-1 min-w-0"><div class="song-title text-lg font-bold text-90 truncate mb-1"> </div> <div class="song-artist text-sm text-50 truncate"> </div> <div class="text-xs text-30 mt-1"> </div></div> <div class="flex items-center gap-1"><button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center" title="隐藏播放器"><!></button> <button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"><!></button></div></div> <div class="progress-section mb-4"><div class="progress-bar flex-1 h-2 bg-[var(--btn-regular-bg)] rounded-full cursor-pointer" role="slider" tabindex="0" aria-label="播放进度" aria-valuemin="0" aria-valuemax="100"><div class="h-full bg-[var(--primary)] rounded-full transition-all duration-100"></div></div></div> <div class="controls flex items-center justify-center gap-2 mb-4"><button><!></button> <button class="btn-plain w-10 h-10 rounded-lg"><!></button> <button><!></button> <button class="btn-plain w-10 h-10 rounded-lg"><!></button> <button><!></button></div> <div class="bottom-controls flex items-center gap-2"><button class="btn-plain w-8 h-8 rounded-lg"><!></button> <div class="flex-1 h-2 bg-[var(--btn-regular-bg)] rounded-full cursor-pointer" role="slider" tabindex="0" aria-label="音量控制" aria-valuemin="0" aria-valuemax="100"><div class="h-full bg-[var(--primary)] rounded-full transition-all duration-100"></div></div> <button><!></button></div></div> <!></div> <style>.orb-player {
	position: relative;
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
}
.orb-player::before {
	content: '';
	position: absolute;
	inset: -2px;
	background: linear-gradient(45deg, var(--primary), transparent, var(--primary));
	border-radius: 50%;
	z-index: -1;
	opacity: 0;
	transition: opacity 0.3s ease;
}
.orb-player:hover::before {
	opacity: 0.3;
	animation: rotate 2s linear infinite;
}
.orb-player .animate-pulse {
	animation: musicWave 1.5s ease-in-out infinite;
}
@keyframes rotate {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}
@keyframes musicWave {
	0%, 100% { transform: scaleY(0.5); }
	50% { transform: scaleY(1); }
}
.music-player.hidden-mode {
	width: 48px;
	height: 48px;
}
.music-player {
    max-width: 320px;
    -webkit-user-select: none;
       -moz-user-select: none;
            user-select: none;
}
.mini-player {
    width: 280px;
    position: absolute;
    bottom: 0;
    right: 0;
    /*left: 0;*/
}
.expanded-player {
    width: 320px;
    position: absolute;
    bottom: 0;
    right: 0;
}
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}
.progress-section div:hover,
.bottom-controls > div:hover {
    transform: scaleY(1.2);
    transition: transform 0.2s ease;
}
@media (max-width: 768px) {
    .music-player {
        max-width: 280px;
        /*left: 8px !important;*/
        bottom: 8px !important;
        right: 8px !important;
    }
    .music-player.expanded {
        width: calc(100vw - 16px);
        max-width: none;
        /*left: 8px !important;*/
        right: 8px !important;
    }
    .playlist-panel {
        width: calc(100vw - 16px) !important;
        /*left: 8px !important;*/
        right: 8px !important;
        max-width: none;
    }
    .controls {
        gap: 8px;
    }
    .controls button {
        width: 36px;
        height: 36px;
    }
    .controls button:nth-child(3) {
        width: 44px;
        height: 44px;
    }
}
@media (max-width: 480px) {
    .music-player {
        max-width: 260px;
    }
    .song-title {
        font-size: 14px;
    }
    .song-artist {
        font-size: 12px;
    }
    .controls {
        gap: 6px;
        margin-bottom: 12px;
    }
    .controls button {
        width: 32px;
        height: 32px;
    }
    .controls button:nth-child(3) {
        width: 40px;
        height: 40px;
    }
    .playlist-item {
        padding: 8px 12px;
    }
    .playlist-item .w-10 {
        width: 32px;
        height: 32px;
    }
}
@keyframes slide-up {
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}
.animate-slide-up {
    animation: slide-up 0.3s ease-out;
}
@media (hover: none) and (pointer: coarse) {
    .music-player button,
    .playlist-item {
        min-height: 44px;
    }
    .progress-section > div,
    .bottom-controls > div:nth-child(2) {
        height: 12px;
    }
}
/* 自定义旋转动画，停止时保持当前位置 */
@keyframes spin-continuous {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
.cover-container img {
    animation: spin-continuous 3s linear infinite;
    animation-play-state: paused;
}
.cover-container img.spinning {
    animation-play-state: running;
}
/* 让主题色按钮更有视觉反馈 */
button.bg-\\[var\\(--primary\\)\\] {
    box-shadow: 0 0 0 2px var(--primary);
    border: none;
}</style>`,1);function Br(l,r){Ja(r,!1);let b=ht.mode??"meting",F=ht.meting_api??"https://www.bilibili.uno/api?server=:server&type=:type&id=:id&auth=:auth&r=:r",_=ht.id??"85025372",p=ht.server??"netease",$=ht.type??"playlist",w=B(!1),L=B(!1),d=B(!1),g=B(!1),D=B(0),A=B(0),T=B(.7),M=B(!1),c=B(!1),S=B(!1),x=B(0),Q=B(""),Z=B(!1),I=B({title:"示例歌曲",artist:"示例艺术家",cover:"/favicon/favicon-light-192.png",url:"",duration:0}),m=B([]),k=B(0),a=B(),J=B(),U=B();const Ne=[{id:1,title:"ひとり上手",artist:"Kaya",cover:"assets/music/cover/hitori.jpg",url:"assets/music/url/hitori.mp3",duration:240},{id:2,title:"眩耀夜行",artist:"スリーズブーケ",cover:"assets/music/cover/xryx.jpg",url:"assets/music/url/xryx.mp3",duration:180},{id:3,title:"春雷の頃",artist:"22/7",cover:"assets/music/cover/cl.jpg",url:"assets/music/url/cl.mp3",duration:200}];async function We(){if(!F||!_)return;u(c,!0);const n=F.replace(":server",p).replace(":type",$).replace(":id",_).replace(":auth","").replace(":r",Date.now().toString());try{const j=await fetch(n);if(!j.ok)throw new Error("meting api error");const H=await j.json();u(m,H.map(N=>{let vt=N.name??N.title??"未知歌曲",wt=N.artist??N.author??"未知艺术家",R=N.duration??0;return R>1e4&&(R=Math.floor(R/1e3)),(!Number.isFinite(R)||R<=0)&&(R=0),{id:N.id,title:vt,artist:wt,cover:N.pic??"",url:N.url??"",duration:R}})),t(m).length>0&&Dt(t(m)[0]),u(c,!1)}catch{_t("Meting 歌单获取失败"),u(c,!1)}}function Oe(){!t(a)||!t(I).url||(t(w)?t(a).pause():t(a).play())}function bt(){u(L,!t(L)),t(L)&&(u(g,!1),u(d,!1))}function gt(){u(d,!t(d)),t(d)&&(u(L,!1),u(g,!1))}function Zt(){u(g,!t(g))}function Ye(){u(S,!t(S))}function qe(){u(x,(t(x)+1)%3)}function Ke(){if(t(m).length<=1)return;const n=t(k)>0?t(k)-1:t(m).length-1;xt(n)}function jt(){if(t(m).length<=1)return;let n;if(t(S))do n=Math.floor(Math.random()*t(m).length);while(n===t(k)&&t(m).length>1);else n=t(k)<t(m).length-1?t(k)+1:0;xt(n)}function xt(n){if(n<0||n>=t(m).length)return;const j=t(w);u(k,n),t(a)&&t(a).pause(),Dt(t(m)[t(k)]),(j||!t(w))&&setTimeout(()=>{t(a)&&(t(a).readyState>=2?t(a).play().catch(()=>{}):t(a).addEventListener("canplay",()=>{t(a).play().catch(()=>{})},{once:!0}))},100)}function yt(n){return n.startsWith("http://")||n.startsWith("https://")||n.startsWith("/")?n:`/${n}`}function Dt(n){!n||!t(a)||(u(I,{...n}),n.url?(u(c,!0),t(a).pause(),q(a,t(a).currentTime=0),u(D,0),u(A,n.duration??0),t(a).removeEventListener("loadeddata",te),t(a).removeEventListener("error",ee),t(a).removeEventListener("loadstart",ae),t(a).addEventListener("loadeddata",te,{once:!0}),t(a).addEventListener("error",ee,{once:!0}),t(a).addEventListener("loadstart",ae,{once:!0}),q(a,t(a).src=yt(n.url)),t(a).load()):u(c,!1))}function te(){u(c,!1),t(a)?.duration&&t(a).duration>1&&(u(A,Math.floor(t(a).duration)),t(m)[t(k)]&&q(m,t(m)[t(k)].duration=t(A)),q(I,t(I).duration=t(A)))}function ee(n){u(c,!1),_t(`无法播放 "${t(I).title}"，正在尝试下一首...`),t(m).length>1?setTimeout(()=>jt(),1e3):_t("播放列表中没有可用的歌曲")}function ae(){}function _t(n){u(Q,n),u(Z,!0),setTimeout(()=>{u(Z,!1)},3e3)}function Ue(){u(Z,!1)}function He(n){if(!t(a)||!t(J))return;const j=t(J).getBoundingClientRect(),N=(n.clientX-j.left)/j.width*t(A);q(a,t(a).currentTime=N),u(D,N)}function Xe(n){if(!t(a)||!t(U))return;const j=t(U).getBoundingClientRect(),H=Math.max(0,Math.min(1,(n.clientX-j.left)/j.width));u(T,H),q(a,t(a).volume=t(T)),u(M,t(T)===0)}function re(){t(a)&&(u(M,!t(M)),q(a,t(a).muted=t(M)))}function ie(n){if(!Number.isFinite(n)||n<0)return"0:00";const j=Math.floor(n/60),H=Math.floor(n%60);return`${j}:${H.toString().padStart(2,"0")}`}function Ge(){t(a)&&(t(a).addEventListener("play",()=>{u(w,!0)}),t(a).addEventListener("pause",()=>{u(w,!1)}),t(a).addEventListener("timeupdate",()=>{u(D,t(a).currentTime)}),t(a).addEventListener("ended",()=>{t(x)===1?(q(a,t(a).currentTime=0),t(a).play().catch(()=>{})):t(x)===2||t(k)<t(m).length-1||t(S)?jt():u(w,!1)}),t(a).addEventListener("error",n=>{u(c,!1)}),t(a).addEventListener("stalled",()=>{}),t(a).addEventListener("waiting",()=>{}))}Ia(()=>{u(a,new Audio),q(a,t(a).volume=t(T)),Ge(),b==="meting"?We():(u(m,[...Ne]),t(m).length>0?Dt(t(m)[0]):_t("本地播放列表为空"))}),Ra(()=>{t(a)&&(t(a).pause(),q(a,t(a).src=""))}),Na();var se=rt(),Je=V(se);{var Ve=n=>{var j=mr(),H=V(j);{var N=e=>{var h=cr(),E=s(h),C=s(E);f(C,{icon:"material-symbols:error",class:"text-xl flex-shrink-0"});var P=v(C,2),o=s(P,!0);i(P);var et=v(P,2),Lt=s(et);f(Lt,{icon:"material-symbols:close",class:"text-lg"}),i(et),i(E),i(h),Mt(()=>X(o,t(Q))),y("click",et,Ue),W(e,h)};z(H,e=>{t(Z)&&e(N)})}var vt=v(H,2);let wt;var R=s(vt);let ne;var Qe=s(R);{var Ze=e=>{f(e,{icon:"eos-icons:loading",class:"text-white text-lg"})},ta=e=>{var h=rt(),E=V(h);{var C=o=>{var et=dr();W(o,et)},P=o=>{f(o,{icon:"material-symbols:music-note",class:"text-white text-lg"})};z(E,o=>{t(w)?o(C):o(P,!1)},!0)}W(e,h)};z(Qe,e=>{t(c)?e(Ze):e(ta,!1)})}i(R);var st=v(R,2);let le;var oe=s(st),Pt=s(oe),zt=s(Pt);let ue;var ce=v(zt,2),ea=s(ce);{var aa=e=>{f(e,{icon:"eos-icons:loading",class:"text-white text-xl"})},ra=e=>{var h=rt(),E=V(h);{var C=o=>{f(o,{icon:"material-symbols:pause",class:"text-white text-xl"})},P=o=>{f(o,{icon:"material-symbols:play-arrow",class:"text-white text-xl"})};z(E,o=>{t(w)?o(C):o(P,!1)},!0)}W(e,h)};z(ea,e=>{t(c)?e(aa):e(ra,!1)})}i(ce),i(Pt);var $t=v(Pt,2),It=s($t),ia=s(It,!0);i(It);var de=v(It,2),sa=s(de,!0);i(de),i($t);var ve=v($t,2),kt=s(ve),na=s(kt);f(na,{icon:"material-symbols:visibility-off",class:"text-lg"}),i(kt);var Rt=v(kt,2),la=s(Rt);f(la,{icon:"material-symbols:expand-less",class:"text-lg"}),i(Rt),i(ve),i(oe),i(st);var Et=v(st,2);let fe;var Nt=s(Et),Wt=s(Nt),pe=s(Wt);let me;i(Wt);var Ot=v(Wt,2),Yt=s(Ot),oa=s(Yt,!0);i(Yt);var qt=v(Yt,2),ua=s(qt,!0);i(qt);var he=v(qt,2),ca=s(he);i(he),i(Ot);var be=v(Ot,2),Ft=s(be),da=s(Ft);f(da,{icon:"material-symbols:visibility-off",class:"text-lg"}),i(Ft);var Kt=v(Ft,2),va=s(Kt);f(va,{icon:"material-symbols:expand-more",class:"text-lg"}),i(Kt),i(be),i(Nt);var Ut=v(Nt,2),nt=s(Ut),fa=s(nt);i(nt),je(nt,e=>u(J,e),()=>t(J)),i(Ut);var Ht=v(Ut,2),lt=s(Ht);let ge;var pa=s(lt);f(pa,{icon:"material-symbols:shuffle",class:"text-lg"}),i(lt);var ft=v(lt,2),ma=s(ft);f(ma,{icon:"material-symbols:skip-previous",class:"text-xl"}),i(ft);var ot=v(ft,2);let xe;var ha=s(ot);{var ba=e=>{f(e,{icon:"eos-icons:loading",class:"text-xl"})},ga=e=>{var h=rt(),E=V(h);{var C=o=>{f(o,{icon:"material-symbols:pause",class:"text-xl"})},P=o=>{f(o,{icon:"material-symbols:play-arrow",class:"text-xl"})};z(E,o=>{t(w)?o(C):o(P,!1)},!0)}W(e,h)};z(ha,e=>{t(c)?e(ba):e(ga,!1)})}i(ot);var pt=v(ot,2),xa=s(pt);f(xa,{icon:"material-symbols:skip-next",class:"text-xl"}),i(pt);var At=v(pt,2);let ye;var ya=s(At);{var _a=e=>{f(e,{icon:"material-symbols:repeat-one",class:"text-lg"})},wa=e=>{var h=rt(),E=V(h);{var C=o=>{f(o,{icon:"material-symbols:repeat",class:"text-lg"})},P=o=>{f(o,{icon:"material-symbols:repeat",class:"text-lg opacity-50"})};z(E,o=>{t(x)===2?o(C):o(P,!1)},!0)}W(e,h)};z(ya,e=>{t(x)===1?e(_a):e(wa,!1)})}i(At),i(Ht);var _e=v(Ht,2),Bt=s(_e),ka=s(Bt);{var Ea=e=>{f(e,{icon:"material-symbols:volume-off",class:"text-lg"})},Fa=e=>{var h=rt(),E=V(h);{var C=o=>{f(o,{icon:"material-symbols:volume-down",class:"text-lg"})},P=o=>{f(o,{icon:"material-symbols:volume-up",class:"text-lg"})};z(E,o=>{t(T)<.5?o(C):o(P,!1)},!0)}W(e,h)};z(ka,e=>{t(M)||t(T)===0?e(Ea):e(Fa,!1)})}i(Bt);var tt=v(Bt,2),Aa=s(tt);i(tt),je(tt,e=>u(U,e),()=>t(U));var Ct=v(tt,2);let we;var Ba=s(Ct);f(Ba,{icon:"material-symbols:queue-music",class:"text-lg"}),i(Ct),i(_e),i(Et);var Ca=v(Et,2);{var La=e=>{var h=pr(),E=s(h),C=s(E),P=s(C,!0);i(C);var o=v(C,2),et=s(o);f(et,{icon:"material-symbols:close",class:"text-lg"}),i(o),i(E);var Lt=v(E,2);Za(Lt,5,()=>t(m),tr,(Xt,ut,K)=>{var at=fr();let ke;var Gt=s(at),Ta=s(Gt);{var Ma=Y=>{f(Y,{icon:"material-symbols:graphic-eq",class:"text-[var(--primary)] animate-pulse"})},Sa=Y=>{var Ce=rt(),Pa=V(Ce);{var za=ct=>{f(ct,{icon:"material-symbols:pause",class:"text-[var(--primary)]"})},$a=ct=>{var Le=vr();Le.textContent=K+1,W(ct,Le)};z(Pa,ct=>{K===t(k)?ct(za):ct($a,!1)},!0)}W(Y,Ce)};z(Ta,Y=>{K===t(k)&&t(w)?Y(Ma):Y(Sa,!1)})}i(Gt);var Jt=v(Gt,2),Ee=s(Jt);i(Jt);var Fe=v(Jt,2),Tt=s(Fe);let Ae;var ja=s(Tt,!0);i(Tt);var Vt=v(Tt,2);let Be;var Da=s(Vt,!0);i(Vt),i(Fe),i(at),Mt(Y=>{ke=O(at,1,"playlist-item flex items-center gap-3 p-3 hover:bg-[var(--btn-plain-bg-hover)] cursor-pointer transition-colors",null,ke,{"bg-[var(--btn-plain-bg)]":K===t(k),"text-[var(--primary)]":K===t(k)}),it(at,"aria-label",`播放 ${t(ut).title??""} - ${t(ut).artist??""}`),it(Ee,"src",Y),it(Ee,"alt",t(ut).title),Ae=O(Tt,1,"font-medium truncate",null,Ae,{"text-[var(--primary)]":K===t(k),"text-90":K!==t(k)}),X(ja,t(ut).title),Be=O(Vt,1,"text-sm text-[var(--content-meta)] truncate",null,Be,{"text-[var(--primary)]":K===t(k)}),X(Da,t(ut).artist)},[()=>yt(t(ut).cover)]),y("click",at,()=>xt(K)),y("keydown",at,Y=>{(Y.key==="Enter"||Y.key===" ")&&(Y.preventDefault(),xt(K))}),W(Xt,at)}),i(Lt),i(h),Mt(Xt=>X(P,Xt),[()=>ar(er.playlist)]),y("click",o,Zt),lr(3,h,()=>ur,()=>({duration:300,axis:"y"})),W(e,h)};z(Ca,e=>{t(g)&&e(La)})}i(vt),Va(2),Mt((e,h,E,C)=>{wt=O(vt,1,"music-player fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",null,wt,{expanded:t(L),"hidden-mode":t(d)}),ne=O(R,1,"orb-player w-12 h-12 bg-[var(--primary)] rounded-full shadow-lg cursor-pointer transition-all duration-500 ease-in-out flex items-center justify-center hover:scale-110 active:scale-95",null,ne,{"opacity-0":!t(d),"scale-0":!t(d),"pointer-events-none":!t(d)}),le=O(st,1,"mini-player card-base bg-[var(--float-panel-bg)] shadow-xl rounded-2xl p-3 transition-all duration-500 ease-in-out",null,le,{"opacity-0":t(L)||t(d),"scale-95":t(L)||t(d),"pointer-events-none":t(L)||t(d)}),it(zt,"src",e),ue=O(zt,1,"w-full h-full object-cover transition-transform duration-300",null,ue,{spinning:t(w)&&!t(c),"animate-pulse":t(c)}),X(ia,t(I).title),X(sa,t(I).artist),fe=O(Et,1,"expanded-player card-base bg-[var(--float-panel-bg)] shadow-xl rounded-2xl p-4 transition-all duration-500 ease-in-out",null,fe,{"opacity-0":!t(L),"scale-95":!t(L),"pointer-events-none":!t(L)}),it(pe,"src",h),me=O(pe,1,"w-full h-full object-cover transition-transform duration-300",null,me,{spinning:t(w)&&!t(c),"animate-pulse":t(c)}),X(oa,t(I).title),X(ua,t(I).artist),X(ca,`${E??""} / ${C??""}`),it(nt,"aria-valuenow",t(A)>0?t(D)/t(A)*100:0),Te(fa,`width: ${t(A)>0?t(D)/t(A)*100:0}%`),ge=O(lt,1,"w-10 h-10 rounded-lg",null,ge,{"btn-regular":t(S),"btn-plain":!t(S)}),lt.disabled=t(m).length<=1,ft.disabled=t(m).length<=1,xe=O(ot,1,"btn-regular w-12 h-12 rounded-full",null,xe,{"opacity-50":t(c)}),ot.disabled=t(c),pt.disabled=t(m).length<=1,ye=O(At,1,"w-10 h-10 rounded-lg",null,ye,{"btn-regular":t(x)>0,"btn-plain":t(x)===0}),it(tt,"aria-valuenow",t(T)*100),Te(Aa,`width: ${t(T)*100}%`),we=O(Ct,1,"btn-plain w-8 h-8 rounded-lg",null,we,{"text-[var(--primary)]":t(g)})},[()=>yt(t(I).cover),()=>yt(t(I).cover),()=>ie(t(D)),()=>ie(t(A))]),y("click",R,gt),y("keydown",R,e=>{(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),gt())}),y("click",kt,De(gt)),y("click",Rt,De(bt)),y("click",st,bt),y("keydown",st,e=>{(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),bt())}),y("click",Ft,gt),y("click",Kt,bt),y("click",nt,He),y("keydown",nt,e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault(),t(J).getBoundingClientRect();const E=.5*t(A);t(a)&&(q(a,t(a).currentTime=E),u(D,E))}}),y("click",lt,Ye),y("click",ft,Ke),y("click",ot,Oe),y("click",pt,jt),y("click",At,qe),y("click",Bt,re),y("click",tt,Xe),y("keydown",tt,e=>{(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),e.key==="Enter"&&re())}),y("click",Ct,Zt),W(n,j)};z(Je,n=>{n(Ve)})}W(l,se),Ga()}export{Br as default};
