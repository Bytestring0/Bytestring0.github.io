import{o as Ia,a as Ra,i as Wa}from"./lifecycle.CkCJrvoB.js";import{a0 as Na,a9 as Ya,b4 as Oa,b5 as qa,aC as Pe,u as ze,b6 as Ka,ad as $e,b7 as Ua,V as Ie,b8 as mt,a6 as Ha,aZ as Va,c as rt,f as Z,a as N,p as Xa,b as Ga,s as u,m as C,al as q,g as t,e as dt,i as v,h as s,r as i,n as Za,t as Mt}from"./template.Crl5BYbz.js";import{a as Ja,s as V}from"./render.Cl_rm6aP.js";import{i as z}from"./if.DltA8pkJ.js";import{e as Qa,i as tr}from"./each.BQXWrRA6.js";import{a as Y,s as it}from"./attributes.SREhIgGW.js";import{e as y}from"./utils.yc7eJYj7.js";import{s as Te}from"./props.ZmPou6pr.js";import{I as f}from"./Icon.TjEaQL5x.js";import{m as bt}from"./config.xhZKsa2k.js";import{I as er}from"./zh_TW.DKypUBtf.js";import{i as ar}from"./translation.DA-T2cmz.js";const rr=()=>performance.now(),X={tick:l=>requestAnimationFrame(l),now:()=>rr(),tasks:new Set};function Re(){const l=X.now();X.tasks.forEach(r=>{r.c(l)||(X.tasks.delete(r),r.f())}),X.tasks.size!==0&&X.tick(Re)}function ir(l){let r;return X.tasks.size===0&&X.tick(Re),{promise:new Promise(h=>{X.tasks.add(r={c:l,f:h})}),abort(){X.tasks.delete(r)}}}function St(l,r){$e(()=>{l.dispatchEvent(new CustomEvent(r))})}function sr(l){if(l==="float")return"cssFloat";if(l==="offset")return"cssOffset";if(l.startsWith("--"))return l;const r=l.split("-");return r.length===1?r[0]:r[0]+r.slice(1).map(h=>h[0].toUpperCase()+h.slice(1)).join("")}function Me(l){const r={},h=l.split(";");for(const F of h){const[_,p]=F.split(":");if(!_||p===void 0)break;const $=sr(_.trim());r[$]=p.trim()}return r}const nr=l=>l;function lr(l,r,h,F){var _=(l&Ka)!==0,p="both",$,w=r.inert,L=r.style.overflow,d,g;function D(){return $e(()=>$??=h()(r,F?.()??{},{direction:p}))}var A={is_global:_,in(){r.inert=w,St(r,"introstart"),d=Jt(r,D(),g,1,()=>{St(r,"introend"),d?.abort(),d=$=void 0,r.style.overflow=L})},out(S){r.inert=!0,St(r,"outrostart"),g=Jt(r,D(),d,0,()=>{St(r,"outroend"),S?.()})},stop:()=>{d?.abort(),g?.abort()}},T=Na;if((T.transitions??=[]).push(A),Ja){var M=_;if(!M){for(var c=T.parent;c&&(c.f&Ya)!==0;)for(;(c=c.parent)&&(c.f&Oa)===0;);M=!c||(c.f&qa)!==0}M&&Pe(()=>{ze(()=>A.in())})}}function Jt(l,r,h,F,_){var p=F===1;if(Ua(r)){var $,w=!1;return Ie(()=>{if(!w){var S=r({direction:p?"in":"out"});$=Jt(l,S,h,F,_)}}),{abort:()=>{w=!0,$?.abort()},deactivate:()=>$.deactivate(),reset:()=>$.reset(),t:()=>$.t()}}if(h?.deactivate(),!r?.duration)return _(),{abort:mt,deactivate:mt,reset:mt,t:()=>F};const{delay:L=0,css:d,tick:g,easing:D=nr}=r;var A=[];if(p&&h===void 0&&(g&&g(0,1),d)){var T=Me(d(0,1));A.push(T,T)}var M=()=>1-F,c=l.animate(A,{duration:L,fill:"forwards"});return c.onfinish=()=>{c.cancel();var S=h?.t()??1-F;h?.abort();var x=F-S,J=r.duration*Math.abs(x),Q=[];if(J>0){var I=!1;if(d)for(var m=Math.ceil(J/16.666666666666668),k=0;k<=m;k+=1){var a=S+x*D(k/m),G=Me(d(a,1-a));Q.push(G),I||=G.overflow==="hidden"}I&&(l.style.overflow="hidden"),M=()=>{var U=c.currentTime;return S+x*D(U/J)},g&&ir(()=>{if(c.playState!=="running")return!1;var U=M();return g(U,1-U),!0})}c=l.animate(Q,{duration:J,fill:"forwards"}),c.onfinish=()=>{M=()=>F,g?.(F,1-F),_()}},{abort:()=>{c&&(c.cancel(),c.effect=null,c.onfinish=mt)},deactivate:()=>{_=mt},reset:()=>{F===0&&g?.(1,0)},t:()=>M()}}function Se(l,r){return l===r||l?.[Va]===r}function je(l={},r,h,F){return Pe(()=>{var _,p;return Ha(()=>{_=p,p=[],ze(()=>{l!==h(...p)&&(r(l,...p),_&&Se(h(..._),l)&&r(null,..._))})}),()=>{Ie(()=>{p&&Se(h(...p),l)&&r(null,...p)})}}),l}function De(l){return function(...r){var h=r[0];return h.stopPropagation(),l?.apply(this,r)}}function or(l){const r=l-1;return r*r*r+1}function ur(l,{delay:r=0,duration:h=400,easing:F=or,axis:_="y"}={}){const p=getComputedStyle(l),$=+p.opacity,w=_==="y"?"height":"width",L=parseFloat(p[w]),d=_==="y"?["top","bottom"]:["left","right"],g=d.map(x=>`${x[0].toUpperCase()}${x.slice(1)}`),D=parseFloat(p[`padding${g[0]}`]),A=parseFloat(p[`padding${g[1]}`]),T=parseFloat(p[`margin${g[0]}`]),M=parseFloat(p[`margin${g[1]}`]),c=parseFloat(p[`border${g[0]}Width`]),S=parseFloat(p[`border${g[1]}Width`]);return{delay:r,duration:h,easing:F,css:x=>`overflow: hidden;opacity: ${Math.min(x*20,1)*$};${w}: ${x*L}px;padding-${d[0]}: ${x*D}px;padding-${d[1]}: ${x*A}px;margin-${d[0]}: ${x*T}px;margin-${d[1]}: ${x*M}px;border-${d[0]}-width: ${x*c}px;border-${d[1]}-width: ${x*S}px;min-${w}: 0`}}var cr=dt('<div class="fixed bottom-20 right-4 z-[60] max-w-sm"><div class="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"><!> <span class="text-sm flex-1"> </span> <button class="text-white/80 hover:text-white transition-colors"><!></button></div></div>'),dr=dt('<div class="flex space-x-0.5"><div class="w-0.5 h-3 bg-white rounded-full animate-pulse"></div> <div class="w-0.5 h-4 bg-white rounded-full animate-pulse" style="animation-delay: 150ms;"></div> <div class="w-0.5 h-2 bg-white rounded-full animate-pulse" style="animation-delay: 300ms;"></div></div>'),vr=dt('<span class="text-sm text-[var(--content-meta)]"></span>'),fr=dt('<div role="button" tabindex="0"><div class="w-6 h-6 flex items-center justify-center"><!></div> <div class="w-10 h-10 rounded-lg overflow-hidden bg-[var(--btn-regular-bg)] flex-shrink-0"><img class="w-full h-full object-cover"/></div> <div class="flex-1 min-w-0"><div> </div> <div> </div></div></div>'),pr=dt('<div class="playlist-panel float-panel fixed bottom-20 right-4 w-80 max-h-96 overflow-hidden z-50"><div class="playlist-header flex items-center justify-between p-4 border-b border-[var(--line-divider)]"><h3 class="text-lg font-semibold text-90"> </h3> <button class="btn-plain w-8 h-8 rounded-lg"><!></button></div> <div class="playlist-content overflow-y-auto max-h-80"></div></div>'),mr=dt(`<!> <div><div role="button" tabindex="0" aria-label="显示音乐播放器"><!></div> <div role="button" tabindex="0" aria-label="展开音乐播放器"><div class="flex items-center gap-3 cursor-pointer"><div class="cover-container relative w-12 h-12 rounded-full overflow-hidden"><img alt="封面"/> <div class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><!></div></div> <div class="flex-1 min-w-0"><div class="text-sm font-medium text-90 truncate"> </div> <div class="text-xs text-50 truncate"> </div></div> <div class="flex items-center gap-1"><button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center" title="隐藏播放器"><!></button> <button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"><!></button></div></div></div> <div><div class="flex items-center gap-4 mb-4"><div class="cover-container relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0"><img alt="封面"/></div> <div class="flex-1 min-w-0"><div class="song-title text-lg font-bold text-90 truncate mb-1"> </div> <div class="song-artist text-sm text-50 truncate"> </div> <div class="text-xs text-30 mt-1"> </div></div> <div class="flex items-center gap-1"><button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center" title="隐藏播放器"><!></button> <button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"><!></button></div></div> <div class="progress-section mb-4"><div class="progress-bar flex-1 h-2 bg-[var(--btn-regular-bg)] rounded-full cursor-pointer" role="slider" tabindex="0" aria-label="播放进度" aria-valuemin="0" aria-valuemax="100"><div class="h-full bg-[var(--primary)] rounded-full transition-all duration-100"></div></div></div> <div class="controls flex items-center justify-center gap-2 mb-4"><button><!></button> <button class="btn-plain w-10 h-10 rounded-lg"><!></button> <button><!></button> <button class="btn-plain w-10 h-10 rounded-lg"><!></button> <button><!></button></div> <div class="bottom-controls flex items-center gap-2"><button class="btn-plain w-8 h-8 rounded-lg"><!></button> <div class="flex-1 h-2 bg-[var(--btn-regular-bg)] rounded-full cursor-pointer" role="slider" tabindex="0" aria-label="音量控制" aria-valuemin="0" aria-valuemax="100"><div class="h-full bg-[var(--primary)] rounded-full transition-all duration-100"></div></div> <button><!></button></div></div> <!></div> <style>.orb-player {
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
}</style>`,1);function Br(l,r){Ga(r,!1);let h=bt.mode??"meting",F=bt.meting_api??"https://www.bilibili.uno/api?server=:server&type=:type&id=:id&auth=:auth&r=:r",_=bt.id??"85025372",p=bt.server??"netease",$=bt.type??"playlist",w=C(!1),L=C(!1),d=C(!1),g=C(!1),D=C(0),A=C(0),T=C(.7),M=C(!1),c=C(!1),S=C(!1),x=C(0),J=C(""),Q=C(!1),I=C({title:"示例歌曲",artist:"示例艺术家",cover:"/favicon/favicon-light-192.png",url:"",duration:0}),m=C([]),k=C(0),a=C(),G=C(),U=C();const We=[{id:1,title:"ひとり上手",artist:"Kaya",cover:"assets/music/cover/hitori.jpg",url:"assets/music/url/hitori.mp3",duration:240},{id:2,title:"眩耀夜行",artist:"スリーズブーケ",cover:"assets/music/cover/xryx.jpg",url:"assets/music/url/xryx.mp3",duration:180},{id:3,title:"春雷の頃",artist:"22/7",cover:"assets/music/cover/cl.jpg",url:"assets/music/url/cl.mp3",duration:200}];async function Ne(){if(!F||!_)return;u(c,!0);const n=F.replace(":server",p).replace(":type",$).replace(":id",_).replace(":auth","").replace(":r",Date.now().toString());try{const j=await fetch(n);if(!j.ok)throw new Error("meting api error");const H=await j.json();u(m,H.map(W=>{let vt=W.name??W.title??"未知歌曲",wt=W.artist??W.author??"未知艺术家",R=W.duration??0;return R>1e4&&(R=Math.floor(R/1e3)),(!Number.isFinite(R)||R<=0)&&(R=0),{id:W.id,title:vt,artist:wt,cover:W.pic??"",url:W.url??"",duration:R}})),t(m).length>0&&Dt(t(m)[0]),u(c,!1)}catch{_t("Meting 歌单获取失败"),u(c,!1)}}function Ye(){!t(a)||!t(I).url||(t(w)?t(a).pause():t(a).play())}function ht(){u(L,!t(L)),t(L)&&(u(g,!1),u(d,!1))}function gt(){u(d,!t(d)),t(d)&&(u(L,!1),u(g,!1))}function Qt(){u(g,!t(g))}function Oe(){u(S,!t(S))}function qe(){u(x,(t(x)+1)%3)}function Ke(){if(t(m).length<=1)return;const n=t(k)>0?t(k)-1:t(m).length-1;xt(n)}function jt(){if(t(m).length<=1)return;let n;if(t(S))do n=Math.floor(Math.random()*t(m).length);while(n===t(k)&&t(m).length>1);else n=t(k)<t(m).length-1?t(k)+1:0;xt(n)}function xt(n){if(n<0||n>=t(m).length)return;const j=t(w);u(k,n),t(a)&&t(a).pause(),Dt(t(m)[t(k)]),(j||!t(w))&&setTimeout(()=>{t(a)&&(t(a).readyState>=2?t(a).play().catch(()=>{}):t(a).addEventListener("canplay",()=>{t(a).play().catch(()=>{})},{once:!0}))},100)}function yt(n){return n.startsWith("http://")||n.startsWith("https://")||n.startsWith("/")?n:`/${n}`}function Dt(n){!n||!t(a)||(u(I,{...n}),n.url?(u(c,!0),t(a).pause(),q(a,t(a).currentTime=0),u(D,0),u(A,n.duration??0),t(a).removeEventListener("loadeddata",te),t(a).removeEventListener("error",ee),t(a).removeEventListener("loadstart",ae),t(a).addEventListener("loadeddata",te,{once:!0}),t(a).addEventListener("error",ee,{once:!0}),t(a).addEventListener("loadstart",ae,{once:!0}),q(a,t(a).src=yt(n.url)),t(a).load()):u(c,!1))}function te(){u(c,!1),t(a)?.duration&&t(a).duration>1&&(u(A,Math.floor(t(a).duration)),t(m)[t(k)]&&q(m,t(m)[t(k)].duration=t(A)),q(I,t(I).duration=t(A)))}function ee(n){u(c,!1),_t(`无法播放 "${t(I).title}"，正在尝试下一首...`),t(m).length>1?setTimeout(()=>jt(),1e3):_t("播放列表中没有可用的歌曲")}function ae(){}function _t(n){u(J,n),u(Q,!0),setTimeout(()=>{u(Q,!1)},3e3)}function Ue(){u(Q,!1)}function He(n){if(!t(a)||!t(G))return;const j=t(G).getBoundingClientRect(),W=(n.clientX-j.left)/j.width*t(A);q(a,t(a).currentTime=W),u(D,W)}function Ve(n){if(!t(a)||!t(U))return;const j=t(U).getBoundingClientRect(),H=Math.max(0,Math.min(1,(n.clientX-j.left)/j.width));u(T,H),q(a,t(a).volume=t(T)),u(M,t(T)===0)}function re(){t(a)&&(u(M,!t(M)),q(a,t(a).muted=t(M)))}function ie(n){if(!Number.isFinite(n)||n<0)return"0:00";const j=Math.floor(n/60),H=Math.floor(n%60);return`${j}:${H.toString().padStart(2,"0")}`}function Xe(){t(a)&&(t(a).addEventListener("play",()=>{u(w,!0)}),t(a).addEventListener("pause",()=>{u(w,!1)}),t(a).addEventListener("timeupdate",()=>{u(D,t(a).currentTime)}),t(a).addEventListener("ended",()=>{t(x)===1?(q(a,t(a).currentTime=0),t(a).play().catch(()=>{})):t(x)===2||t(k)<t(m).length-1||t(S)?jt():u(w,!1)}),t(a).addEventListener("error",n=>{u(c,!1)}),t(a).addEventListener("stalled",()=>{}),t(a).addEventListener("waiting",()=>{}))}Ia(()=>{u(a,new Audio),q(a,t(a).volume=t(T)),Xe(),h==="meting"?Ne():(u(m,[...We]),t(m).length>0?Dt(t(m)[0]):_t("本地播放列表为空"))}),Ra(()=>{t(a)&&(t(a).pause(),q(a,t(a).src=""))}),Wa();var se=rt(),Ge=Z(se);{var Ze=n=>{var j=mr(),H=Z(j);{var W=e=>{var b=cr(),E=s(b),B=s(E);f(B,{icon:"material-symbols:error",class:"text-xl flex-shrink-0"});var P=v(B,2),o=s(P,!0);i(P);var et=v(P,2),Lt=s(et);f(Lt,{icon:"material-symbols:close",class:"text-lg"}),i(et),i(E),i(b),Mt(()=>V(o,t(J))),y("click",et,Ue),N(e,b)};z(H,e=>{t(Q)&&e(W)})}var vt=v(H,2);let wt;var R=s(vt);let ne;var Je=s(R);{var Qe=e=>{f(e,{icon:"eos-icons:loading",class:"text-white text-lg"})},ta=e=>{var b=rt(),E=Z(b);{var B=o=>{var et=dr();N(o,et)},P=o=>{f(o,{icon:"material-symbols:music-note",class:"text-white text-lg"})};z(E,o=>{t(w)?o(B):o(P,!1)},!0)}N(e,b)};z(Je,e=>{t(c)?e(Qe):e(ta,!1)})}i(R);var st=v(R,2);let le;var oe=s(st),Pt=s(oe),zt=s(Pt);let ue;var ce=v(zt,2),ea=s(ce);{var aa=e=>{f(e,{icon:"eos-icons:loading",class:"text-white text-xl"})},ra=e=>{var b=rt(),E=Z(b);{var B=o=>{f(o,{icon:"material-symbols:pause",class:"text-white text-xl"})},P=o=>{f(o,{icon:"material-symbols:play-arrow",class:"text-white text-xl"})};z(E,o=>{t(w)?o(B):o(P,!1)},!0)}N(e,b)};z(ea,e=>{t(c)?e(aa):e(ra,!1)})}i(ce),i(Pt);var $t=v(Pt,2),It=s($t),ia=s(It,!0);i(It);var de=v(It,2),sa=s(de,!0);i(de),i($t);var ve=v($t,2),kt=s(ve),na=s(kt);f(na,{icon:"material-symbols:visibility-off",class:"text-lg"}),i(kt);var Rt=v(kt,2),la=s(Rt);f(la,{icon:"material-symbols:expand-less",class:"text-lg"}),i(Rt),i(ve),i(oe),i(st);var Et=v(st,2);let fe;var Wt=s(Et),Nt=s(Wt),pe=s(Nt);let me;i(Nt);var Yt=v(Nt,2),Ot=s(Yt),oa=s(Ot,!0);i(Ot);var qt=v(Ot,2),ua=s(qt,!0);i(qt);var be=v(qt,2),ca=s(be);i(be),i(Yt);var he=v(Yt,2),Ft=s(he),da=s(Ft);f(da,{icon:"material-symbols:visibility-off",class:"text-lg"}),i(Ft);var Kt=v(Ft,2),va=s(Kt);f(va,{icon:"material-symbols:expand-more",class:"text-lg"}),i(Kt),i(he),i(Wt);var Ut=v(Wt,2),nt=s(Ut),fa=s(nt);i(nt),je(nt,e=>u(G,e),()=>t(G)),i(Ut);var Ht=v(Ut,2),lt=s(Ht);let ge;var pa=s(lt);f(pa,{icon:"material-symbols:shuffle",class:"text-lg"}),i(lt);var ft=v(lt,2),ma=s(ft);f(ma,{icon:"material-symbols:skip-previous",class:"text-xl"}),i(ft);var ot=v(ft,2);let xe;var ba=s(ot);{var ha=e=>{f(e,{icon:"eos-icons:loading",class:"text-xl"})},ga=e=>{var b=rt(),E=Z(b);{var B=o=>{f(o,{icon:"material-symbols:pause",class:"text-xl"})},P=o=>{f(o,{icon:"material-symbols:play-arrow",class:"text-xl"})};z(E,o=>{t(w)?o(B):o(P,!1)},!0)}N(e,b)};z(ba,e=>{t(c)?e(ha):e(ga,!1)})}i(ot);var pt=v(ot,2),xa=s(pt);f(xa,{icon:"material-symbols:skip-next",class:"text-xl"}),i(pt);var At=v(pt,2);let ye;var ya=s(At);{var _a=e=>{f(e,{icon:"material-symbols:repeat-one",class:"text-lg"})},wa=e=>{var b=rt(),E=Z(b);{var B=o=>{f(o,{icon:"material-symbols:repeat",class:"text-lg"})},P=o=>{f(o,{icon:"material-symbols:repeat",class:"text-lg opacity-50"})};z(E,o=>{t(x)===2?o(B):o(P,!1)},!0)}N(e,b)};z(ya,e=>{t(x)===1?e(_a):e(wa,!1)})}i(At),i(Ht);var _e=v(Ht,2),Ct=s(_e),ka=s(Ct);{var Ea=e=>{f(e,{icon:"material-symbols:volume-off",class:"text-lg"})},Fa=e=>{var b=rt(),E=Z(b);{var B=o=>{f(o,{icon:"material-symbols:volume-down",class:"text-lg"})},P=o=>{f(o,{icon:"material-symbols:volume-up",class:"text-lg"})};z(E,o=>{t(T)<.5?o(B):o(P,!1)},!0)}N(e,b)};z(ka,e=>{t(M)||t(T)===0?e(Ea):e(Fa,!1)})}i(Ct);var tt=v(Ct,2),Aa=s(tt);i(tt),je(tt,e=>u(U,e),()=>t(U));var Bt=v(tt,2);let we;var Ca=s(Bt);f(Ca,{icon:"material-symbols:queue-music",class:"text-lg"}),i(Bt),i(_e),i(Et);var Ba=v(Et,2);{var La=e=>{var b=pr(),E=s(b),B=s(E),P=s(B,!0);i(B);var o=v(B,2),et=s(o);f(et,{icon:"material-symbols:close",class:"text-lg"}),i(o),i(E);var Lt=v(E,2);Qa(Lt,5,()=>t(m),tr,(Vt,ut,K)=>{var at=fr();let ke;var Xt=s(at),Ta=s(Xt);{var Ma=O=>{f(O,{icon:"material-symbols:graphic-eq",class:"text-[var(--primary)] animate-pulse"})},Sa=O=>{var Be=rt(),Pa=Z(Be);{var za=ct=>{f(ct,{icon:"material-symbols:pause",class:"text-[var(--primary)]"})},$a=ct=>{var Le=vr();Le.textContent=K+1,N(ct,Le)};z(Pa,ct=>{K===t(k)?ct(za):ct($a,!1)},!0)}N(O,Be)};z(Ta,O=>{K===t(k)&&t(w)?O(Ma):O(Sa,!1)})}i(Xt);var Gt=v(Xt,2),Ee=s(Gt);i(Gt);var Fe=v(Gt,2),Tt=s(Fe);let Ae;var ja=s(Tt,!0);i(Tt);var Zt=v(Tt,2);let Ce;var Da=s(Zt,!0);i(Zt),i(Fe),i(at),Mt(O=>{ke=Y(at,1,"playlist-item flex items-center gap-3 p-3 hover:bg-[var(--btn-plain-bg-hover)] cursor-pointer transition-colors",null,ke,{"bg-[var(--btn-plain-bg)]":K===t(k),"text-[var(--primary)]":K===t(k)}),it(at,"aria-label",`播放 ${t(ut).title??""} - ${t(ut).artist??""}`),it(Ee,"src",O),it(Ee,"alt",t(ut).title),Ae=Y(Tt,1,"font-medium truncate",null,Ae,{"text-[var(--primary)]":K===t(k),"text-90":K!==t(k)}),V(ja,t(ut).title),Ce=Y(Zt,1,"text-sm text-[var(--content-meta)] truncate",null,Ce,{"text-[var(--primary)]":K===t(k)}),V(Da,t(ut).artist)},[()=>yt(t(ut).cover)]),y("click",at,()=>xt(K)),y("keydown",at,O=>{(O.key==="Enter"||O.key===" ")&&(O.preventDefault(),xt(K))}),N(Vt,at)}),i(Lt),i(b),Mt(Vt=>V(P,Vt),[()=>ar(er.playlist)]),y("click",o,Qt),lr(3,b,()=>ur,()=>({duration:300,axis:"y"})),N(e,b)};z(Ba,e=>{t(g)&&e(La)})}i(vt),Za(2),Mt((e,b,E,B)=>{wt=Y(vt,1,"music-player fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",null,wt,{expanded:t(L),"hidden-mode":t(d)}),ne=Y(R,1,"orb-player w-12 h-12 bg-[var(--primary)] rounded-full shadow-lg cursor-pointer transition-all duration-500 ease-in-out flex items-center justify-center hover:scale-110 active:scale-95",null,ne,{"opacity-0":!t(d),"scale-0":!t(d),"pointer-events-none":!t(d)}),le=Y(st,1,"mini-player card-base bg-[var(--float-panel-bg)] shadow-xl rounded-2xl p-3 transition-all duration-500 ease-in-out",null,le,{"opacity-0":t(L)||t(d),"scale-95":t(L)||t(d),"pointer-events-none":t(L)||t(d)}),it(zt,"src",e),ue=Y(zt,1,"w-full h-full object-cover transition-transform duration-300",null,ue,{spinning:t(w)&&!t(c),"animate-pulse":t(c)}),V(ia,t(I).title),V(sa,t(I).artist),fe=Y(Et,1,"expanded-player card-base bg-[var(--float-panel-bg)] shadow-xl rounded-2xl p-4 transition-all duration-500 ease-in-out",null,fe,{"opacity-0":!t(L),"scale-95":!t(L),"pointer-events-none":!t(L)}),it(pe,"src",b),me=Y(pe,1,"w-full h-full object-cover transition-transform duration-300",null,me,{spinning:t(w)&&!t(c),"animate-pulse":t(c)}),V(oa,t(I).title),V(ua,t(I).artist),V(ca,`${E??""} / ${B??""}`),it(nt,"aria-valuenow",t(A)>0?t(D)/t(A)*100:0),Te(fa,`width: ${t(A)>0?t(D)/t(A)*100:0}%`),ge=Y(lt,1,"w-10 h-10 rounded-lg",null,ge,{"btn-regular":t(S),"btn-plain":!t(S)}),lt.disabled=t(m).length<=1,ft.disabled=t(m).length<=1,xe=Y(ot,1,"btn-regular w-12 h-12 rounded-full",null,xe,{"opacity-50":t(c)}),ot.disabled=t(c),pt.disabled=t(m).length<=1,ye=Y(At,1,"w-10 h-10 rounded-lg",null,ye,{"btn-regular":t(x)>0,"btn-plain":t(x)===0}),it(tt,"aria-valuenow",t(T)*100),Te(Aa,`width: ${t(T)*100}%`),we=Y(Bt,1,"btn-plain w-8 h-8 rounded-lg",null,we,{"text-[var(--primary)]":t(g)})},[()=>yt(t(I).cover),()=>yt(t(I).cover),()=>ie(t(D)),()=>ie(t(A))]),y("click",R,gt),y("keydown",R,e=>{(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),gt())}),y("click",kt,De(gt)),y("click",Rt,De(ht)),y("click",st,ht),y("keydown",st,e=>{(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),ht())}),y("click",Ft,gt),y("click",Kt,ht),y("click",nt,He),y("keydown",nt,e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault(),t(G).getBoundingClientRect();const E=.5*t(A);t(a)&&(q(a,t(a).currentTime=E),u(D,E))}}),y("click",lt,Oe),y("click",ft,Ke),y("click",ot,Ye),y("click",pt,jt),y("click",At,qe),y("click",Ct,re),y("click",tt,Ve),y("keydown",tt,e=>{(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),e.key==="Enter"&&re())}),y("click",Bt,Qt),N(n,j)};z(Ge,n=>{n(Ze)})}N(l,se),Xa()}export{Br as default};
