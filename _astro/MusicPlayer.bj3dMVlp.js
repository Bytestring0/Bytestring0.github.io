import{o as dt,a as ft}from"./index-client.DAOUdMF8.js";import{k as vt,o as gt,ar as mt,ai as yt,bf as ht,bg as bt,e as Be,u as Fe,bh as xt,bi as wt,T as Ve,bj as ae,am as Ne,bk as He,a0 as he,bd as kt,b as Q,a2 as ue,a3 as J,a as _,p as Z,c as w,r as x,t as I,d as C,f as S,g as k,a7 as X,a5 as Ee,bl as Le,s as z,a4 as q,a8 as _t}from"./template.CCjEd3fg.js";import{a as Pt,s as W}from"./render.BFAzjGV_.js";import{i as F}from"./if.D2kwkiTg.js";import{p as O,s as R,a as A,d as je,e as Oe}from"./props.CEYSlsJw.js";import{d as H,a as L,e as G}from"./utils.H49CfAjb.js";import{I as T}from"./Icon.C0NokuIf.js";import{m as le}from"./config.BjxLd_pw.js";import{I as D}from"./zh_TW.B395Vq90.js";import{i as M}from"./translation.CoebwDtg.js";import{a as pt}from"./actions.IEm3z71m.js";import{e as Ct,i as St}from"./each.2xSna65w.js";function Tt(t,e,i,a,l){vt&&gt();var r=e.$$slots?.[i],n=!1;r===!0&&(r=e.children,n=!0),r===void 0||r(t,n?()=>a:a)}const Et=()=>performance.now(),Y={tick:t=>requestAnimationFrame(t),now:()=>Et(),tasks:new Set};function Ke(){const t=Y.now();Y.tasks.forEach(e=>{e.c(t)||(Y.tasks.delete(e),e.f())}),Y.tasks.size!==0&&Y.tick(Ke)}function Lt(t){let e;return Y.tasks.size===0&&Y.tick(Ke),{promise:new Promise(i=>{Y.tasks.add(e={c:t,f:i})}),abort(){Y.tasks.delete(e)}}}function se(t,e){Ne(()=>{t.dispatchEvent(new CustomEvent(e))})}function It(t){if(t==="float")return"cssFloat";if(t==="offset")return"cssOffset";if(t.startsWith("--"))return t;const e=t.split("-");return e.length===1?e[0]:e[0]+e.slice(1).map(i=>i[0].toUpperCase()+i.slice(1)).join("")}function Ie(t){const e={},i=t.split(";");for(const a of i){const[l,r]=a.split(":");if(!l||r===void 0)break;const n=It(l.trim());e[n]=r.trim()}return e}const Rt=t=>t;function Dt(t,e,i,a){var l=(t&xt)!==0,r="both",n,u=e.inert,m=e.style.overflow,o,v;function s(){return Ne(()=>n??=i()(e,a?.()??{},{direction:r}))}var f={is_global:l,in(){e.inert=u,o=me(e,s(),v,1,()=>{se(e,"introend"),o?.abort(),o=n=void 0,e.style.overflow=m})},out(P){e.inert=!0,v=me(e,s(),o,0,()=>{se(e,"outroend"),P?.()})},stop:()=>{o?.abort(),v?.abort()}},c=mt;if((c.nodes.t??=[]).push(f),Pt){var h=l;if(!h){for(var d=c.parent;d&&(d.f&yt)!==0;)for(;(d=d.parent)&&(d.f&ht)===0;);h=!d||(d.f&bt)!==0}h&&Be(()=>{Fe(()=>f.in())})}}function me(t,e,i,a,l){var r=a===1;if(wt(e)){var n,u=!1;return Ve(()=>{if(!u){var P=e({direction:r?"in":"out"});n=me(t,P,i,a,l)}}),{abort:()=>{u=!0,n?.abort()},deactivate:()=>n.deactivate(),reset:()=>n.reset(),t:()=>n.t()}}if(i?.deactivate(),!e?.duration&&!e?.delay)return se(t,r?"introstart":"outrostart"),l(),{abort:ae,deactivate:ae,reset:ae,t:()=>a};const{delay:m=0,css:o,tick:v,easing:s=Rt}=e;var f=[];if(r&&i===void 0&&(v&&v(0,1),o)){var c=Ie(o(0,1));f.push(c,c)}var h=()=>1-a,d=t.animate(f,{duration:m,fill:"forwards"});return d.onfinish=()=>{d.cancel(),se(t,r?"introstart":"outrostart");var P=i?.t()??1-a;i?.abort();var y=a-P,E=e.duration*Math.abs(y),b=[];if(E>0){var p=!1;if(o)for(var V=Math.ceil(E/16.666666666666668),N=0;N<=V;N+=1){var U=P+y*s(N/V),te=Ie(o(U,1-U));b.push(te),p||=te.overflow==="hidden"}p&&(t.style.overflow="hidden"),h=()=>{var $=d.currentTime;return P+y*s($/E)},v&&Lt(()=>{if(d.playState!=="running")return!1;var $=h();return v($,1-$),!0})}d=t.animate(b,{duration:E,fill:"forwards"}),d.onfinish=()=>{h=()=>a,v?.(a,1-a),l()}},{abort:()=>{d&&(d.cancel(),d.effect=null,d.onfinish=ae)},deactivate:()=>{l=ae},reset:()=>{a===0&&v?.(1,0)},t:()=>h()}}function Mt(t,e,i=e){var a=()=>{i(t.volume)};e()==null&&a(),He(t,["volumechange"],a,!1),he(()=>{var l=Number(e());l!==t.volume&&!isNaN(l)&&(t.volume=l)})}function At(t,e,i=e){var a=()=>{i(t.muted)};e()==null&&a(),He(t,["volumechange"],a,!1),he(()=>{var l=!!e();t.muted!==l&&(t.muted=l)})}function Re(t,e){return t===e||t?.[kt]===e}function zt(t={},e,i,a){return Be(()=>{var l,r;return he(()=>{l=r,r=[],Fe(()=>{t!==i(...r)&&(e(t,...r),l&&Re(i(...l),t)&&e(null,...l))})}),()=>{Ve(()=>{r&&Re(i(...r),t)&&e(null,...r)})}}),t}var Bt=S('<div class="flex space-x-0.5"><div class="w-0.5 h-3 bg-white rounded-full animate-pulse"></div> <div class="w-0.5 h-4 bg-white rounded-full animate-pulse" style="animation-delay: 150ms;"></div> <div class="w-0.5 h-2 bg-white rounded-full animate-pulse" style="animation-delay: 300ms;"></div></div>'),Ft=S('<div class="orb-player w-12 h-12 bg-[var(--primary)] rounded-full shadow-lg cursor-pointer transition-all duration-500 ease-in-out flex items-center justify-center hover:scale-110 active:scale-95" role="button" tabindex="0"><!></div>'),Vt=S('<div role="button" tabindex="0"><img/> <div class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><!></div></div>'),Nt=S("<div><img/></div>");function ye(t,e){Q(e,!0);let i=O(e,"size",3,"mini"),a=O(e,"interactive",3,!1);function l(s){return s.startsWith("http://")||s.startsWith("https://")||s.startsWith("/")?s:`/${s}`}const r={mini:"cover-container relative w-12 h-12 rounded-full overflow-hidden",expanded:"cover-container relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0"};var n=ue(),u=J(n);{var m=s=>{var f=Ft(),c=w(f);{var h=y=>{T(y,{icon:"eos-icons:loading",class:"text-white text-lg"})},d=y=>{var E=Bt();_(y,E)},P=y=>{T(y,{icon:"material-symbols:music-note",class:"text-white text-lg"})};F(c,y=>{e.isLoading?y(h):e.isPlaying?y(d,1):y(P,-1)})}x(f),I(y=>R(f,"aria-label",y),[()=>M(D.musicPlayerShow)]),L("click",f,function(...y){e.onclick?.apply(this,y)}),L("keydown",f,y=>{(y.key==="Enter"||y.key===" ")&&(y.preventDefault(),e.onclick?.())}),_(s,f)},o=s=>{var f=Vt(),c=w(f);let h;var d=C(c,2),P=w(d);{var y=p=>{T(p,{icon:"eos-icons:loading",class:"text-white text-xl"})},E=p=>{T(p,{icon:"material-symbols:pause",class:"text-white text-xl"})},b=p=>{T(p,{icon:"material-symbols:play-arrow",class:"text-white text-xl"})};F(P,p=>{e.isLoading?p(y):e.isPlaying?p(E,1):p(b,-1)})}x(d),x(f),I((p,V,N)=>{A(f,1,`${r[i()]} cursor-pointer`,"svelte-9fvt81"),R(f,"aria-label",p),R(c,"src",V),R(c,"alt",N),h=A(c,1,"w-full h-full object-cover transition-transform duration-300 svelte-9fvt81",null,h,{spinning:e.isPlaying&&!e.isLoading,"animate-pulse":e.isLoading})},[()=>e.isPlaying?M(D.musicPlayerPause):M(D.musicPlayerPlay),()=>l(e.cover),()=>M(D.musicPlayerCover)]),L("click",f,function(...p){e.onclick?.apply(this,p)}),L("keydown",f,p=>{(p.key==="Enter"||p.key===" ")&&(p.preventDefault(),e.onclick?.())}),_(s,f)},v=s=>{var f=Nt(),c=w(f);let h;x(f),I((d,P)=>{A(f,1,je(r[i()]),"svelte-9fvt81"),R(c,"src",d),R(c,"alt",P),h=A(c,1,"w-full h-full object-cover transition-transform duration-300 svelte-9fvt81",null,h,{spinning:e.isPlaying&&!e.isLoading,"animate-pulse":e.isLoading})},[()=>l(e.cover),()=>M(D.musicPlayerCover)]),_(s,f)};F(u,s=>{i()==="orb"?s(m):a()?s(o,1):s(v,-1)})}_(t,n),Z()}H(["click","keydown"]);var Ht=S('<div class="flex-1 min-w-0"><div class="text-sm font-medium text-90 truncate"> </div> <div class="text-xs text-50 truncate"> </div></div>'),jt=S('<div class="text-xs text-30 mt-1"> </div>'),Ot=S('<div class="flex-1 min-w-0"><div class="song-title text-lg font-bold text-90 truncate mb-1"> </div> <div class="song-artist text-sm text-50 truncate"> </div> <!></div>');function De(t,e){Q(e,!0);let i=O(e,"showTime",3,!1),a=O(e,"size",3,"mini");function l(o){if(!Number.isFinite(o)||o<0)return"0:00";const v=Math.floor(o/60),s=Math.floor(o%60);return`${v}:${s.toString().padStart(2,"0")}`}var r=ue(),n=J(r);{var u=o=>{var v=Ht(),s=w(v),f=w(s,!0);x(s);var c=C(s,2),h=w(c,!0);x(c),x(v),I(()=>{W(f,e.song.title),W(h,e.song.artist)}),_(o,v)},m=o=>{var v=Ot(),s=w(v),f=w(s,!0);x(s);var c=C(s,2),h=w(c,!0);x(c);var d=C(c,2);{var P=y=>{var E=jt(),b=w(E);x(E),I((p,V)=>W(b,`${p??""} / ${V??""}`),[()=>l(e.currentTime),()=>l(e.duration)]),_(y,E)};F(d,y=>{i()&&y(P)})}x(v),I(()=>{W(f,e.song.title),W(h,e.song.artist)}),_(o,v)};F(n,o=>{a()==="mini"?o(u):o(m,-1)})}_(t,r),Z()}var Kt=S('<!> <div class="flex-1 min-w-0 cursor-pointer" role="button" tabindex="0"><!></div> <div class="flex items-center gap-1"><button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"><!></button> <button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"><!></button></div>',1),Wt=S('<div class="flex items-center gap-1"><button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"><!></button> <button><!></button></div>'),Yt=S("<!> <!> <!>",1),Xt=S("<div><!></div>");function We(t,e){Q(e,!0);let i=O(e,"size",3,"mini"),a=O(e,"showControls",3,!1),l=O(e,"showPlaylist",3,!1);var r=Xt(),n=w(r);{var u=o=>{var v=Kt(),s=J(v);ye(s,{get cover(){return e.song.cover},get isPlaying(){return e.isPlaying},get isLoading(){return e.isLoading},size:"mini",interactive:!0,get onclick(){return e.onCoverClick}});var f=C(s,2),c=w(f);De(c,{get song(){return e.song},get currentTime(){return e.currentTime},get duration(){return e.duration},size:"mini"}),x(f);var h=C(f,2),d=w(h),P=w(d);T(P,{icon:"material-symbols:visibility-off",class:"text-lg"}),x(d);var y=C(d,2),E=w(y);T(E,{icon:"material-symbols:expand-less",class:"text-lg"}),x(y),x(h),I((b,p)=>{R(f,"aria-label",b),R(d,"title",p)},[()=>M(D.musicPlayerExpand),()=>M(D.musicPlayerHide)]),L("click",f,function(...b){e.onInfoClick?.apply(this,b)}),L("keydown",f,b=>{(b.key==="Enter"||b.key===" ")&&(b.preventDefault(),e.onInfoClick?.())}),L("click",d,b=>{b.stopPropagation(),e.onHideClick?.()}),L("click",y,b=>{b.stopPropagation(),e.onExpandClick?.()}),_(o,v)},m=o=>{var v=Yt(),s=J(v);ye(s,{get cover(){return e.song.cover},get isPlaying(){return e.isPlaying},get isLoading(){return e.isLoading},size:"expanded"});var f=C(s,2);De(f,{get song(){return e.song},get currentTime(){return e.currentTime},get duration(){return e.duration},showTime:!0,size:"expanded"});var c=C(f,2);{var h=d=>{var P=Wt(),y=w(P),E=w(y);T(E,{icon:"material-symbols:visibility-off",class:"text-lg"}),x(y);var b=C(y,2);let p;var V=w(b);T(V,{icon:"material-symbols:queue-music",class:"text-lg"}),x(b),x(P),I((N,U)=>{R(y,"title",N),p=A(b,1,"btn-plain w-8 h-8 rounded-lg flex items-center justify-center",null,p,{"text-[var(--primary)]":l()}),R(b,"title",U)},[()=>M(D.musicPlayerHide),()=>M(D.musicPlayerPlaylist)]),L("click",y,function(...N){e.onHideClick?.apply(this,N)}),L("click",b,function(...N){e.onPlaylistClick?.apply(this,N)}),_(d,P)};F(c,d=>{a()&&d(h)})}_(o,v)};F(n,o=>{i()==="mini"?o(u):o(m,-1)})}x(r),I(()=>A(r,1,je(i()==="mini"?"flex items-center gap-3 mb-0":"flex items-center gap-4 mb-4"))),_(t,r),Z()}H(["click","keydown"]);var Ut=S("<div><!></div>");function qt(t,e){var i=Ut();let a;var l=w(i);We(l,{get song(){return e.song},get currentTime(){return e.currentTime},get duration(){return e.duration},get isPlaying(){return e.isPlaying},get isLoading(){return e.isLoading},size:"mini",get onCoverClick(){return e.onCoverClick},get onInfoClick(){return e.onInfoClick},get onHideClick(){return e.onHideClick},get onExpandClick(){return e.onExpandClick}}),x(i),I(()=>a=A(i,1,"mini-player card-base bg-[var(--float-panel-bg)] shadow-xl rounded-2xl p-3 absolute bottom-0 right-0 w-[17.5rem] svelte-g9ac72",null,a,{"mini-enter":!e.isHidden,"mini-leave":e.isHidden,"pointer-events-none":e.isHidden})),_(t,i)}var Gt=S('<div class="progress-bar flex-1 h-2 bg-[var(--btn-regular-bg)] rounded-full cursor-pointer" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100"><div class="h-full bg-[var(--primary)] rounded-full transition-all duration-100"></div></div>');function Jt(t,e){Q(e,!0);var i=Gt(),a=w(i);x(i),I(l=>{R(i,"aria-label",l),R(i,"aria-valuenow",e.duration>0?e.currentTime/e.duration*100:0),Oe(a,`width: ${e.duration>0?e.currentTime/e.duration*100:0}%`)},[()=>M(D.musicPlayerProgress)]),L("click",i,function(...l){e.onclick?.apply(this,l)}),L("keydown",i,function(...l){e.onkeydown?.apply(this,l)}),_(t,i),Z()}H(["click","keydown"]);var Qt=S('<div class="progress-section mb-4"><!></div>');function Zt(t,e){var i=Qt(),a=w(i);Jt(a,{get currentTime(){return e.currentTime},get duration(){return e.duration},get onclick(){return e.onProgressClick},get onkeydown(){return e.onProgressKeyDown}}),x(i),_(t,i)}var $t=S("<button><!></button>");function ei(t,e){var i=$t();let a;var l=w(i);{var r=m=>{T(m,{icon:"eos-icons:loading",class:"text-xl"})},n=m=>{T(m,{icon:"material-symbols:pause",class:"text-xl"})},u=m=>{T(m,{icon:"material-symbols:play-arrow",class:"text-xl"})};F(l,m=>{e.isLoading?m(r):e.isPlaying?m(n,1):m(u,-1)})}x(i),I(()=>{a=A(i,1,"btn-regular w-12 h-12 rounded-full",null,a,{"opacity-50":e.isLoading}),i.disabled=e.isLoading}),L("click",i,function(...m){e.onclick?.apply(this,m)}),_(t,i)}H(["click"]);var ti=S('<button class="btn-plain w-10 h-10 rounded-lg"><!></button>');function ii(t,e){let i=O(e,"disabled",3,!1);var a=ti(),l=w(a);T(l,{icon:"material-symbols:skip-previous",class:"text-xl"}),x(a),I(()=>a.disabled=i()),L("click",a,function(...r){e.onclick?.apply(this,r)}),_(t,a)}H(["click"]);var ni=S('<button class="btn-plain w-10 h-10 rounded-lg"><!></button>');function ai(t,e){let i=O(e,"disabled",3,!1);var a=ni(),l=w(a);T(l,{icon:"material-symbols:skip-next",class:"text-xl"}),x(a),I(()=>a.disabled=i()),L("click",a,function(...r){e.onclick?.apply(this,r)}),_(t,a)}H(["click"]);var ri=S("<button><!></button>"),li=S("<button><!></button>");function Me(t,e){let i=O(e,"repeatMode",3,0),a=O(e,"disabled",3,!1);var l=ue(),r=J(l);{var n=m=>{var o=ri();let v;var s=w(o);T(s,{icon:"material-symbols:shuffle",class:"text-lg"}),x(o),I(()=>{v=A(o,1,"w-10 h-10 rounded-lg",null,v,{"btn-regular":e.isActive,"btn-plain":!e.isActive}),o.disabled=a()}),L("click",o,function(...f){e.onclick?.apply(this,f)}),_(m,o)},u=m=>{var o=li();let v;var s=w(o);{var f=d=>{T(d,{icon:"material-symbols:repeat-one",class:"text-lg"})},c=d=>{T(d,{icon:"material-symbols:repeat",class:"text-lg"})},h=d=>{T(d,{icon:"material-symbols:repeat",class:"text-lg opacity-50"})};F(s,d=>{i()===1?d(f):i()===2?d(c,1):d(h,-1)})}x(o),I(()=>v=A(o,1,"w-10 h-10 rounded-lg",null,v,{"btn-regular":e.isActive,"btn-plain":!e.isActive})),L("click",o,function(...d){e.onclick?.apply(this,d)}),_(m,o)};F(r,m=>{e.mode==="shuffle"?m(n):m(u,-1)})}_(t,l)}H(["click"]);var oi=S('<div class="controls flex items-center justify-center gap-2 mb-4"><!> <!> <!> <!> <!></div>');function si(t,e){var i=oi(),a=w(i);{let m=X(()=>!e.canSkip);Me(a,{mode:"shuffle",get isActive(){return e.isShuffled},get onclick(){return e.onShuffleClick},get disabled(){return k(m)}})}var l=C(a,2);{let m=X(()=>!e.canSkip);ii(l,{get onclick(){return e.onPrevClick},get disabled(){return k(m)}})}var r=C(l,2);ei(r,{get isPlaying(){return e.isPlaying},get isLoading(){return e.isLoading},get onclick(){return e.onPlayClick}});var n=C(r,2);{let m=X(()=>!e.canSkip);ai(n,{get onclick(){return e.onNextClick},get disabled(){return k(m)}})}var u=C(n,2);{let m=X(()=>e.isRepeating>0);Me(u,{mode:"repeat",get isActive(){return k(m)},get repeatMode(){return e.isRepeating},get onclick(){return e.onRepeatClick}})}x(i),_(t,i)}var ui=S('<button class="btn-plain w-8 h-8 rounded-lg"><!></button>');function ci(t,e){var i=ui(),a=w(i);{var l=u=>{T(u,{icon:"material-symbols:volume-off",class:"text-lg"})},r=u=>{T(u,{icon:"material-symbols:volume-down",class:"text-lg"})},n=u=>{T(u,{icon:"material-symbols:volume-up",class:"text-lg"})};F(a,u=>{e.isMuted||e.volume===0?u(l):e.volume<.5?u(r,1):u(n,-1)})}x(i),L("click",i,function(...u){e.onclick?.apply(this,u)}),_(t,i)}H(["click"]);var di=S('<div class="flex-1 h-2 bg-[var(--btn-regular-bg)] rounded-full cursor-pointer touch-none" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100"><div></div></div>');function fi(t,e){var i=di(),a=w(i);let l;x(i),pt(i,r=>e.volumeBarRef?.(r)),I(()=>{R(i,"aria-label",e.ariaLabel),R(i,"aria-valuenow",e.volume*100),l=A(a,1,"h-full bg-[var(--primary)] rounded-full transition-all",null,l,{"duration-100":!e.isVolumeDragging,"duration-0":e.isVolumeDragging}),Oe(a,`width: ${e.volume*100}%`)}),L("pointerdown",i,function(...r){e.onpointerdown?.apply(this,r)}),L("keydown",i,function(...r){e.onkeydown?.apply(this,r)}),_(t,i)}H(["pointerdown","keydown"]);var vi=S('<div class="bottom-controls flex items-center gap-2"><!> <!> <!></div>');function gi(t,e){var i=vi(),a=w(i);ci(a,{get volume(){return e.volume},get isMuted(){return e.isMuted},get onclick(){return e.onVolumeButtonClick}});var l=C(a,2);fi(l,{get volume(){return e.volume},get isVolumeDragging(){return e.isVolumeDragging},get volumeBarRef(){return e.volumeBarRef},get onpointerdown(){return e.onSliderPointerDown},get onkeydown(){return e.onSliderKeyDown},get ariaLabel(){return e.ariaLabel}});var r=C(l,2);Tt(r,e,"default",{}),x(i),_(t,i)}var mi=S('<button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"><!></button>'),yi=S("<div><!> <!> <!> <!></div>");function hi(t,e){Q(e,!0);var i=yi();let a;var l=w(i);We(l,{get song(){return e.song},get currentTime(){return e.currentTime},get duration(){return e.duration},get isPlaying(){return e.isPlaying},get isLoading(){return e.isLoading},size:"expanded",showControls:!0,get showPlaylist(){return e.showPlaylist},get onHideClick(){return e.onHideClick},get onPlaylistClick(){return e.onPlaylistClick}});var r=C(l,2);Zt(r,{get currentTime(){return e.currentTime},get duration(){return e.duration},get onProgressClick(){return e.onProgressClick},get onProgressKeyDown(){return e.onProgressKeyDown}});var n=C(r,2);si(n,{get isPlaying(){return e.isPlaying},get isLoading(){return e.isLoading},get isShuffled(){return e.isShuffled},get isRepeating(){return e.isRepeating},get canSkip(){return e.canSkip},get onPlayClick(){return e.onPlayClick},get onPrevClick(){return e.onPrevClick},get onNextClick(){return e.onNextClick},get onShuffleClick(){return e.onShuffleClick},get onRepeatClick(){return e.onRepeatClick}});var u=C(n,2);{let m=X(()=>M(D.musicPlayerVolume));gi(u,{get volume(){return e.volume},get isMuted(){return e.isMuted},get isVolumeDragging(){return e.isVolumeDragging},get volumeBarRef(){return e.volumeBarRef},get onVolumeButtonClick(){return e.onVolumeButtonClick},get onSliderPointerDown(){return e.onSliderPointerDown},get onSliderKeyDown(){return e.onSliderKeyDown},get ariaLabel(){return k(m)},children:(o,v)=>{var s=mi(),f=w(s);T(f,{icon:"material-symbols:expand-more",class:"text-lg"}),x(s),I(c=>R(s,"title",c),[()=>M(D.musicPlayerCollapse)]),L("click",s,function(...c){e.onCollapseClick?.apply(this,c)}),_(o,s)},$$slots:{default:!0}})}x(i),I(()=>a=A(i,1,"expanded-player card-base bg-[var(--float-panel-bg)] shadow-xl rounded-2xl p-4 transition-all duration-500 ease-in-out absolute bottom-0 right-0 w-80",null,a,{"opacity-0":e.isHidden,"scale-95":e.isHidden,"pointer-events-none":e.isHidden})),_(t,i),Z()}H(["click"]);function bi(t){const e=t-1;return e*e*e+1}function xi(t,{delay:e=0,duration:i=400,easing:a=bi,axis:l="y"}={}){const r=getComputedStyle(t),n=+r.opacity,u=l==="y"?"height":"width",m=parseFloat(r[u]),o=l==="y"?["top","bottom"]:["left","right"],v=o.map(y=>`${y[0].toUpperCase()}${y.slice(1)}`),s=parseFloat(r[`padding${v[0]}`]),f=parseFloat(r[`padding${v[1]}`]),c=parseFloat(r[`margin${v[0]}`]),h=parseFloat(r[`margin${v[1]}`]),d=parseFloat(r[`border${v[0]}Width`]),P=parseFloat(r[`border${v[1]}Width`]);return{delay:e,duration:i,easing:a,css:y=>`overflow: hidden;opacity: ${Math.min(y*20,1)*n};${u}: ${y*m}px;padding-${o[0]}: ${y*s}px;padding-${o[1]}: ${y*f}px;margin-${o[0]}: ${y*c}px;margin-${o[1]}: ${y*h}px;border-${o[0]}-width: ${y*d}px;border-${o[1]}-width: ${y*P}px;min-${u}: 0`}}var wi=S('<span class="text-sm text-[var(--content-meta)]"> </span>'),ki=S('<div role="button" tabindex="0"><div class="w-6 h-6 flex items-center justify-center"><!></div> <div class="w-10 h-10 rounded-lg overflow-hidden bg-[var(--btn-regular-bg)] flex-shrink-0"><img loading="lazy" class="w-full h-full object-cover"/></div> <div class="flex-1 min-w-0"><div> </div> <div> </div></div></div>');function _i(t,e){Q(e,!0);function i(b){return b.startsWith("http://")||b.startsWith("https://")||b.startsWith("/")?b:`/${b}`}var a=ki();let l;var r=w(a),n=w(r);{var u=b=>{T(b,{icon:"material-symbols:graphic-eq",class:"text-[var(--primary)] animate-pulse"})},m=b=>{T(b,{icon:"material-symbols:pause",class:"text-[var(--primary)]"})},o=b=>{var p=wi(),V=w(p,!0);x(p),I(()=>W(V,e.index+1)),_(b,p)};F(n,b=>{e.isCurrent&&e.isPlaying?b(u):e.isCurrent?b(m,1):b(o,-1)})}x(r);var v=C(r,2),s=w(v);x(v);var f=C(v,2),c=w(f);let h;var d=w(c,!0);x(c);var P=C(c,2);let y;var E=w(P,!0);x(P),x(f),x(a),I(b=>{l=A(a,1,"playlist-item flex items-center gap-3 p-3 hover:bg-[var(--btn-plain-bg-hover)] cursor-pointer transition-colors",null,l,{"bg-[var(--btn-plain-bg)]":e.isCurrent,"text-[var(--primary)]":e.isCurrent}),R(a,"aria-label",`播放 ${e.song.title??""} - ${e.song.artist??""}`),R(s,"src",b),R(s,"alt",e.song.title),h=A(c,1,"font-medium truncate",null,h,{"text-[var(--primary)]":e.isCurrent,"text-90":!e.isCurrent}),W(d,e.song.title),y=A(P,1,"text-sm text-[var(--content-meta)] truncate",null,y,{"text-[var(--primary)]":e.isCurrent}),W(E,e.song.artist)},[()=>i(e.song.cover)]),L("click",a,function(...b){e.onclick?.apply(this,b)}),L("keydown",a,b=>{(b.key==="Enter"||b.key===" ")&&(b.preventDefault(),e.onclick())}),_(t,a),Z()}H(["click","keydown"]);var Pi=S('<div class="playlist-panel float-panel fixed bottom-20 right-4 w-80 max-h-96 overflow-hidden z-50"><div class="playlist-header flex items-center justify-between p-4 border-b border-[var(--line-divider)]"><h3 class="text-lg font-semibold text-90"> </h3> <button class="btn-plain w-8 h-8 rounded-lg"><!></button></div> <div class="playlist-content overflow-y-auto max-h-80 hide-scrollbar"></div></div>');function pi(t,e){Q(e,!0);var i=ue(),a=J(i);{var l=r=>{var n=Pi(),u=w(n),m=w(u),o=w(m,!0);x(m);var v=C(m,2),s=w(v);T(s,{icon:"material-symbols:close",class:"text-lg"}),x(v),x(u);var f=C(u,2);Ct(f,21,()=>e.playlist,St,(c,h,d)=>{{let P=X(()=>d===e.currentIndex);_i(c,{get song(){return k(h)},index:d,get isCurrent(){return k(P)},get isPlaying(){return e.isPlaying},onclick:()=>e.onPlaySong(d)})}}),x(f),x(n),I(c=>W(o,c),[()=>M(D.musicPlayerPlaylist)]),L("click",v,function(...c){e.onClose?.apply(this,c)}),Dt(3,n,()=>xi,()=>({duration:300,axis:"y"})),_(r,n)};F(a,r=>{e.show&&r(l)})}_(t,i),Z()}H(["click"]);const Ae="music-player-volume",Ci={title:"Sample Song",artist:"Sample Artist",cover:"/favicon/favicon.ico",url:"",duration:0,id:0},Si=3e3,Ti=1e3;function Ei(){return{isPlaying:!1,currentTime:0,duration:0,volume:.7,isMuted:!1,isLoading:!1,currentSong:Ci,autoplayFailed:!1,willAutoPlay:!1}}function Li(t,e){!e||!t.currentSong.url||(t.isPlaying?e.pause():e.play().catch(()=>{}))}function Ii(t){t.isMuted=!t.isMuted}function Ri(t,e){if(t.isLoading=!1,e?.duration&&e.duration>1&&(t.duration=Math.floor(e.duration),t.currentSong={...t.currentSong,duration:t.duration}),t.willAutoPlay||t.isPlaying){const i=e?.play();i!==void 0&&i.catch(a=>{console.warn("自动播放被拦截，等待用户交互:",a),t.autoplayFailed=!0,t.isPlaying=!1})}}function Di(t){return t.currentSong.url?(t.isLoading=!1,{shouldContinue:t.isPlaying||t.willAutoPlay}):{shouldContinue:!1}}function oe(t,e,i=!0){e&&(e.url!==t.currentSong.url&&(t.currentSong={...e},e.url?t.isLoading=!0:t.isLoading=!1),t.willAutoPlay=i)}function Mi(t,e){if(t.autoplayFailed&&e){const i=e.play();i!==void 0&&i.then(()=>{t.autoplayFailed=!1}).catch(()=>{})}}function Ai(){return{playlist:[],currentIndex:0,isShuffled:!1,isRepeating:0}}function zi(t){t.isShuffled=!t.isShuffled,t.isShuffled&&(t.isRepeating=0)}function Bi(t){t.isRepeating=(t.isRepeating+1)%3,t.isRepeating!==0&&(t.isShuffled=!1)}function Fi(t){return t.playlist.length<=1?t.currentIndex:t.currentIndex>0?t.currentIndex-1:t.playlist.length-1}function Vi(t,e=!0){if(t.playlist.length<=1)return t.currentIndex;let i;if(t.isShuffled)do i=Math.floor(Math.random()*t.playlist.length);while(i===t.currentIndex&&t.playlist.length>1);else i=t.currentIndex<t.playlist.length-1?t.currentIndex+1:0;return i}function ge(t,e){return e<0||e>=t.playlist.length?!1:(t.currentIndex=e,!0)}async function Ni(t,e,i,a,l,r,n,u){r();const m=e.replace(":server",i).replace(":type",a).replace(":id",l).replace(":auth","").replace(":r",Date.now().toString());try{const o=await fetch(m);if(!o.ok)throw new Error("meting api error");const v=await o.json();t.playlist=v.map(s=>{let f=s.name??s.title??M(D.unknownSong),c=s.artist??s.author??M(D.unknownArtist),h=s.duration??0;return h>1e4&&(h=Math.floor(h/1e3)),(!Number.isFinite(h)||h<=0)&&(h=0),{id:s.id,title:f,artist:c,cover:s.pic??"",url:s.url??"",duration:h}}),n()}catch{u(M(D.musicPlayerErrorPlaylist)),n()}}function Hi(t){return t.playlist.length>1}const ze=["click","keydown","touchstart"],ji=typeof document<"u";function Oi(t){return ji?(ze.forEach(e=>{document.addEventListener(e,t,{capture:!0})}),()=>{ze.forEach(e=>{document.removeEventListener(e,t,{capture:!0})})}):()=>{}}function Ki(t){return t.startsWith("http://")||t.startsWith("https://")||t.startsWith("/")?t:`/${t}`}var Wi=S('<div class="fixed bottom-20 right-4 z-[60] max-w-sm"><div class="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"><!> <span class="text-sm flex-1"> </span> <button class="text-white/80 hover:text-white transition-colors"><!></button></div></div>'),Yi=S(`<!> <div><div><!></div> <!> <!> <!></div> <style>.orb-player-container {
			position: absolute;
			bottom: 0;
			right: 0;
		}

		.orb-enter {
			animation: orbElasticIn 460ms cubic-bezier(0.22, 1.25, 0.36, 1)
				forwards;
		}

		.orb-leave {
			animation: orbElasticOut 360ms cubic-bezier(0.4, 0, 1, 1) forwards;
		}

		@keyframes orbElasticIn {
			0% {
				opacity: 0;
				transform: translateX(0) scale(0.55);
			}
			70% {
				opacity: 1;
				transform: translateX(0) scale(1.12);
			}
			100% {
				opacity: 1;
				transform: translateX(0) scale(1);
			}
		}

		@keyframes orbElasticOut {
			0% {
				opacity: 1;
				transform: translateX(0) scale(1);
			}
			100% {
				opacity: 0;
				transform: translateX(0) scale(0.6);
			}
		}

		.music-player.hidden-mode {
			width: 3rem;
			height: 3rem;
		}

		.music-player {
			width: 20rem;
			max-width: 20rem;
			min-width: 20rem;
			-webkit-user-select: none;
			   -moz-user-select: none;
			        user-select: none;
		}

		:global(.mini-player) {
			position: absolute;
			bottom: 0;
			right: 0;
		}

		:global(.expanded-player) {
			position: absolute;
			bottom: 0;
			right: 0;
		}

		:global(.orb-player) {
			position: relative;
			backdrop-filter: blur(10px);
			-webkit-backdrop-filter: blur(10px);
		}

		:global(.orb-player::before) {
			content: "";
			position: absolute;
			inset: -0.125rem;
			background: linear-gradient(
				45deg,
				var(--primary),
				transparent,
				var(--primary)
			);
			border-radius: 50%;
			z-index: -1;
			opacity: 0;
			transition: opacity 0.3s ease;
		}

		:global(.orb-player:hover::before) {
			opacity: 0.3;
			animation: rotate 2s linear infinite;
		}

		:global(.orb-player .animate-pulse) {
			animation: musicWave 1.5s ease-in-out infinite;
		}

		@keyframes rotate {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}

		@keyframes musicWave {
			0%,
			100% {
				transform: scaleY(0.5);
			}
			50% {
				transform: scaleY(1);
			}
		}

		:global(.animate-pulse) {
			animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		}

		@keyframes pulse {
			0%,
			100% {
				opacity: 1;
			}
			50% {
				opacity: 0.5;
			}
		}

		:global(.progress-section div:hover),
		:global(.bottom-controls > div:hover) {
			transform: scaleY(1.2);
			transition: transform 0.2s ease;
		}

		@media (max-width: 768px) {
			.music-player {
				width: 280px !important;
				min-width: 280px !important;
				max-width: 280px !important;
				bottom: 0.5rem !important;
				right: 0.5rem !important;
			}
			:global(.mini-player) {
				width: 280px !important;
			}
			:global(.expanded-player) {
				width: calc(100vw - 16px);
				max-width: none;
			}
			.music-player.expanded {
				width: calc(100vw - 16px);
				min-width: calc(100vw - 16px);
				max-width: none;
				right: 0.5rem !important;
			}
			:global(.playlist-panel) {
				width: calc(100vw - 16px) !important;
				right: 0.5rem !important;
				max-width: none;
			}
			:global(.controls) {
				gap: 8px;
			}
			:global(.controls button) {
				width: 36px;
				height: 36px;
			}
			:global(.controls button:nth-child(3)) {
				width: 44px;
				height: 44px;
			}
		}

		@media (max-width: 480px) {
			.music-player {
				width: 260px;
				min-width: 260px;
				max-width: 260px;
			}
			:global(.song-title) {
				font-size: 14px;
			}
			:global(.song-artist) {
				font-size: 12px;
			}
			:global(.controls) {
				gap: 6px;
				margin-bottom: 12px;
			}
			:global(.controls button) {
				width: 32px;
				height: 32px;
			}
			:global(.controls button:nth-child(3)) {
				width: 40px;
				height: 40px;
			}
			:global(.playlist-item) {
				padding: 8px 12px;
			}
			:global(.playlist-item .w-10) {
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
			:global(.music-player button),
			:global(.playlist-item) {
				min-height: 44px;
			}
			:global(.progress-section > div),
			:global(.bottom-controls > div:nth-child(2)) {
				height: 12px;
			}
		}

		@keyframes spin-continuous {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}

		:global(.cover-container img) {
			animation: spin-continuous 3s linear infinite;
			animation-play-state: paused;
		}

		:global(.cover-container img.spinning) {
			animation-play-state: running;
		}

		:global(button.bg-\\\\[var\\\\(--primary\\\\)\\\\]) {
			box-shadow: 0 0 0 2px var(--primary);
			border: none;
		}</style>`,1),Xi=S('<audio preload="auto"></audio> <!>',1);function ln(t,e){Q(e,!0);let i=le.meting_api,a=le.id,l=le.server,r=le.type,n=Ee(Ei()),u=Ee(Ai()),m=q(!1),o=q(!1),v=q(!1),s=q(""),f=q(!1),c=q(void 0),h=null,d=q(!1),P=q(!1),y=null,E=null;function b(){try{if(typeof localStorage<"u"){const g=localStorage.getItem(Ae);g!==null&&!isNaN(parseFloat(g))&&(n.volume=parseFloat(g))}}catch(g){console.warn("Failed to load volume settings from localStorage:",g)}}function p(){try{typeof localStorage<"u"&&localStorage.setItem(Ae,n.volume.toString())}catch(g){console.warn("Failed to save volume settings to localStorage:",g)}}function V(g){z(s,g,!0),z(f,!0),setTimeout(()=>{z(f,!1)},Si)}function N(){z(f,!1)}function U(){z(m,!k(m)),k(m)&&(z(v,!1),z(o,!1))}function te(){z(o,!k(o)),k(o)&&(z(m,!1),z(v,!1))}function $(){z(v,!k(v))}function Ye(){zi(u)}function Xe(){Bi(u)}function Ue(){const g=Fi(u);g!==-1&&(ge(u,g),oe(n,u.playlist[g],n.isPlaying))}function ce(g=!0){const B=Vi(u,n.isPlaying);B!==-1&&(ge(u,B),oe(n,u.playlist[B],g))}function qe(g){ge(u,g)&&oe(n,u.playlist[g],!0)}function be(){Li(n,k(c))}function xe(){Ii(n)}function Ge(){Ri(n,k(c))}function Je(g){const B=Di(n);V(M(D.musicPlayerErrorSong)),B.shouldContinue&&u.playlist.length>1?setTimeout(()=>ce(!0),Ti):u.playlist.length<=1&&V(M(D.musicPlayerErrorEmpty))}function Qe(){u.isRepeating===1?k(c)&&(k(c).currentTime=0,k(c).play().catch(()=>{})):u.isRepeating===2||u.isShuffled?ce(!0):n.isPlaying=!1}function Ze(g){const B=g.currentTarget;if(!k(c)||!B)return;const K=B.getBoundingClientRect(),ie=(g.clientX-K.left)/K.width*n.duration;k(c).currentTime=ie,n.currentTime=ie}function $e(g){if(g.key==="Enter"||g.key===" "){g.preventDefault();const K=.5*n.duration;k(c)&&(k(c).currentTime=K,n.currentTime=K)}}function et(g){h&&(g.preventDefault(),z(P,!0),h.setPointerCapture(g.pointerId),y=h.getBoundingClientRect(),we(g.clientX))}function tt(g){k(P)&&(g.preventDefault(),z(d,!0),!E&&(E=requestAnimationFrame(()=>{we(g.clientX),E=null})))}function it(g){k(P)&&(z(P,!1),z(d,!1),y=null,h&&h.releasePointerCapture(g.pointerId),E&&(cancelAnimationFrame(E),E=null),p())}function we(g){if(!k(c)||!h)return;const B=y||h.getBoundingClientRect(),K=Math.max(0,Math.min(1,(g-B.left)/B.width));n.volume=K}function nt(g){(g.key==="Enter"||g.key===" ")&&(g.preventDefault(),g.key==="Enter"&&xe())}let de;dt(()=>{b(),de=Oi(()=>Mi(n,k(c))),Ni(u,i,l,r,a,()=>{n.isLoading=!0},()=>{n.isLoading=!1},V).then(()=>{u.playlist.length>0&&oe(n,u.playlist[0],!1)})}),ft(()=>{de&&de()});function at(g){h=g}var ke=Xi();G("pointermove",Le,tt),G("pointerup",Le,it);var j=J(ke);zt(j,g=>z(c,g),()=>k(c));var rt=C(j,2);{var lt=g=>{var B=Yi(),K=J(B);{var _e=ee=>{var ne=Wi(),Se=w(ne),Te=w(Se);T(Te,{icon:"material-symbols:error",class:"text-xl flex-shrink-0"});var fe=C(Te,2),ut=w(fe,!0);x(fe);var ve=C(fe,2),ct=w(ve);T(ct,{icon:"material-symbols:close",class:"text-lg"}),x(ve),x(Se),x(ne),I(()=>W(ut,k(s))),L("click",ve,N),_(ee,ne)};F(K,ee=>{k(f)&&ee(_e)})}var ie=C(K,2);let Pe;var re=w(ie),ot=w(re);ye(ot,{get cover(){return n.currentSong.cover},get isPlaying(){return n.isPlaying},get isLoading(){return n.isLoading},size:"orb",onclick:te}),x(re);var pe=C(re,2);{let ee=X(()=>k(m)||k(o));qt(pe,{get song(){return n.currentSong},get currentTime(){return n.currentTime},get duration(){return n.duration},get isPlaying(){return n.isPlaying},get isLoading(){return n.isLoading},get isHidden(){return k(ee)},onCoverClick:be,onInfoClick:U,onHideClick:te,onExpandClick:U})}var Ce=C(pe,2);{let ee=X(()=>Hi(u)),ne=X(()=>!k(m));hi(Ce,{get song(){return n.currentSong},get currentTime(){return n.currentTime},get duration(){return n.duration},get isPlaying(){return n.isPlaying},get isLoading(){return n.isLoading},get isShuffled(){return u.isShuffled},get isRepeating(){return u.isRepeating},get showPlaylist(){return k(v)},get canSkip(){return k(ee)},get volume(){return n.volume},get isMuted(){return n.isMuted},get isVolumeDragging(){return k(d)},get isHidden(){return k(ne)},volumeBarRef:at,onPlayClick:be,onPrevClick:Ue,onNextClick:()=>ce(),onShuffleClick:Ye,onRepeatClick:Xe,onProgressClick:Ze,onProgressKeyDown:$e,onVolumeButtonClick:xe,onSliderPointerDown:et,onSliderKeyDown:nt,onHideClick:te,onPlaylistClick:$,onCollapseClick:U})}var st=C(Ce,2);pi(st,{get playlist(){return u.playlist},get currentIndex(){return u.currentIndex},get isPlaying(){return n.isPlaying},get show(){return k(v)},onClose:$,onPlaySong:qe}),x(ie),_t(2),I(()=>{Pe=A(ie,1,"music-player fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",null,Pe,{expanded:k(m),"hidden-mode":k(o)}),A(re,1,`orb-player-container ${k(o)?"orb-enter pointer-events-auto":"orb-leave pointer-events-none"}`)}),_(g,B)};F(rt,g=>{g(lt)})}I(g=>R(j,"src",g),[()=>Ki(n.currentSong.url)]),G("play",j,()=>n.isPlaying=!0),G("pause",j,()=>n.isPlaying=!1),G("timeupdate",j,()=>{k(c)&&(n.currentTime=k(c).currentTime)}),G("ended",j,Qe),G("error",j,Je),G("loadeddata",j,Ge),Mt(j,()=>n.volume,g=>n.volume=g),At(j,()=>n.isMuted,g=>n.isMuted=g),_(t,ke),Z()}H(["click"]);export{ln as default};
