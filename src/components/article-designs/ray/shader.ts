import { signalWorlds } from "./signal-worlds";
export const vertex = `attribute vec2 aPosition;void main(){gl_Position=vec4(aPosition,0.,1.);}`;
export const fragment = `
precision highp float;
uniform vec2 uResolution,uPixel;
uniform vec3 uCamera,uTarget,uRgb;
uniform float uTime,uRoll,uWorld,uCut,uHit,uMid,uLens;
uniform sampler2D uSource,uOutput,uField,uBackground;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-.012;}
vec2 near(vec2 a,vec2 b){return a.x<b.x?a:b;}
vec2 obj(vec3 p,vec3 o,vec3 b,float m){return vec2(box(p-o,b),m);}
vec2 cpu(vec3 p){
 vec2 d=obj(p,vec3(0.,-.65,1.),vec3(12.6,.38,11.6),1.);
 d=near(d,obj(p,vec3(0.,-.2,1.),vec3(11.8,.12,10.8),2.));
 vec3 q=p-vec3(-7.,.1,5.),r=vec3(mod(q.x+.25,.5)-.25,q.y,mod(q.z+.3,.6)-.3);
 d=near(d,vec2(max(box(r,vec3(.21,.1,.25)),box(q,vec3(3.,.5,4.))),4.));
 q=p-vec3(-1.5,.14,2.);r=vec3(mod(q.x+.5,1.)-.5,q.y,q.z);
 d=near(d,vec2(max(box(r,vec3(.37,.14,1.75)),box(q,vec3(2.7,.5,1.8))),5.));
 q=p-vec3(4.,.13,1.);r=vec3(mod(q.x+.18,.36)-.18,q.y,mod(q.z+.25,.5)-.25);
 d=near(d,vec2(max(box(r,vec3(.13,.13,.19)),box(q,vec3(1.6,.5,2.))),6.));
 q=p-vec3(6.,.12,5.);r=vec3(mod(q.x+.3,.6)-.3,q.y,mod(q.z+.22,.44)-.22);
 d=near(d,vec2(max(box(r,vec3(.24,.12,.17)),box(q,vec3(3.,.5,1.8))),7.));
 q=p-vec3(7.,.17,-4.5);r=vec3(mod(q.x+.65,1.3)-.65,q.y,mod(q.z+.5,1.)-.5);
 d=near(d,vec2(max(box(r,vec3(.53,.17,.39)),box(q,vec3(3.3,.5,2.5))),8.));
 d=near(d,obj(p,vec3(-3.4,.15,-4.8),vec3(2.,.15,1.6),12.));
 d=near(d,obj(p,vec3(.8,.15,-6.8),vec3(2.1,.15,1.2),13.));
 // Contacts and metallization, not a giant free-standing transistor on the die.
 q=vec3(mod(p.x+.7,1.4)-.7,p.y-.01,mod(p.z+.7,1.4)-.7);
 float via=max(length(q.xz)-.035,abs(q.y)-.08);
 d=near(d,vec2(max(via,box(p-vec3(0.,0.,1.),vec3(11.5,.2,10.5))),3.));
 return d;
}
vec2 station(vec3 p){
 vec2 d=cpu(p);
 d=near(d,obj(p,vec3(0.,6.,-20.),vec3(8.15,4.7,.35),14.));
 d=near(d,obj(p,vec3(0.,6.,-19.59),vec3(7.85,4.415,.025),15.));
 d=near(d,obj(p,vec3(0.,1.,-20.2),vec3(.42,1.5,.38),14.));
 d=near(d,obj(p,vec3(0.,-.42,-19.8),vec3(2.6,.12,1.5),14.));
 vec3 q=p-vec3(-21.,.2,1.);vec3 cell=vec3(mod(q.x+.7,1.4)-.7,q.y,mod(q.z+.8,1.6)-.8);
 d=near(d,vec2(max(box(cell,vec3(.56,.23,.64)),box(q,vec3(3.,.6,5.))),16.));
 d=near(d,obj(p,vec3(-21.,-.12,1.),vec3(3.3,.12,5.4),1.));
 d=near(d,obj(p,vec3(18.,.3,-15.),vec3(2.,.3,2.3),24.));
 d=near(d,obj(p,vec3(18.,-.1,-15.),vec3(2.5,.1,2.8),1.));
 d=near(d,obj(p,vec3(0.,-1.2,-4.),vec3(34.,.15,29.),17.));
 return d;
}
vec2 fins(vec3 p){
 vec2 d=obj(p,vec3(0.,-.2,0.),vec3(4.,.2,2.8),19.);
 // Two FinFET banks in a CMOS inverter. Source/drain run along each fin.
 for(int bank=0;bank<2;bank++){
  float z=bank==0?-1.:1.;
  for(int i=0;i<2;i++){
   float zz=z+(float(i)-.5)*.28;
   d=near(d,obj(p,vec3(0.,.3,zz),vec3(2.,.3,.065),11.));
   d=near(d,obj(p,vec3(0.,.47,zz),vec3(.25,.24,.09),18.));
   d=near(d,obj(p,vec3(0.,.73,zz),vec3(.28,.055,.13),10.));
   d=near(d,obj(p,vec3(0.,.83,zz),vec3(.1,.07,.09),10.));
   d=near(d,obj(p,vec3(0.,.46,zz-.115),vec3(.28,.24,.025),10.));
   d=near(d,obj(p,vec3(0.,.46,zz+.115),vec3(.28,.24,.025),10.));
  }
  d=near(d,obj(p,vec3(-1.4,.61,z),vec3(.45,.12,.43),9.));
  d=near(d,obj(p,vec3(1.4,.61,z),vec3(.45,.12,.43),9.));
  d=near(d,obj(p,vec3(-1.4,.95,z),vec3(.1,.27,.12),3.));
  d=near(d,obj(p,vec3(1.4,.95,z),vec3(.1,.27,.12),3.));
  d=near(d,obj(p,vec3(-1.4,1.25,z*1.5),vec3(.1,.08,.6),3.));
 }
 d=near(d,obj(p,vec3(0.,1.25,-2.),vec3(2.9,.08,.12),3.));
 d=near(d,obj(p,vec3(0.,1.25,2.),vec3(2.9,.08,.12),3.));
 d=near(d,obj(p,vec3(1.4,1.25,0.),vec3(.1,.08,1.2),3.));
 d=near(d,obj(p,vec3(0.,.93,0.),vec3(.12,.06,1.6),10.));
 return d;
}
vec2 diagram(vec3 p){
 vec3 q=p-vec3(0.,4.,-12.);
 if(uTime<114. || (uTime>=147.083&&uTime<148.903))return obj(p,vec3(0.,4.,-12.),vec3(5.8,3.2625,.04),22.);
 float separate=smoothstep(202.,206.,uTime)*(1.-smoothstep(212.,216.,uTime));
 if(separate>.01){
  vec2 d=obj(p,vec3(-separate*7.5,4.,-14.),vec3(3.1,1.74375,.04),21.);
  d=near(d,obj(p,vec3(0.,4.+separate*.5,-12.),vec3(3.1,1.74375,.04),22.));
  d=near(d,obj(p,vec3(separate*7.5,4.,-10.),vec3(3.1,1.74375,.04),23.));return d;
 }
 float zoom=1.-smoothstep(151.163,154.343,uTime);
 float scale=mix(7.,2.,zoom);
 // An abstract memory layout, with small gaps between image tiles.
 vec3 cell=vec3(mod(q.x+.18,.36)-.18,mod(q.y+.18,.36)-.18,q.z);
 float grid=max(box(cell,vec3(.17,.17,.045)),box(q,vec3(scale,scale*.5625,.1)));
 return vec2(grid,20.);
}
vec2 oled(vec3 p){
 vec3 q=vec3(mod(p.x+.15,.3)-.15,p.y,mod(p.z+.28,.56)-.28);
 vec2 d=obj(p,vec3(0.,-.1,0.),vec3(4.8,.1,2.8),19.);
 d=near(d,vec2(max(box(q-vec3(0.,.12,0.),vec3(.11,.06,.21)),box(p,vec3(4.7,.3,2.7))),25.));return d;
}
vec2 signalMap(vec3 p);
vec2 map(vec3 p){if(uWorld>4.5)return signalMap(p);if(uWorld<.5)return station(p);if(uWorld<1.5)return cpu(p);if(uWorld<2.5)return fins(p);if(uWorld<3.5)return oled(p);return diagram(p);}
vec3 env(vec3 rd){float panel=pow(max(dot(rd,normalize(vec3(-.4,1.,.2))),0.),14.);return vec3(.009,.016,.027)+vec3(.2,.3,.4)*panel;}
float circuit(vec2 p){vec2 f=fract(p*.8);return exp(-min(abs(f.x-.22),abs(f.y-.67))*95.)*.6;}
vec3 preserve(vec3 image){return -log(max(vec3(.012),1.-pow(clamp(image,0.,.98),vec3(1./.86))))/1.65;}
${signalWorlds}
vec3 surface(vec3 p,vec3 n,vec3 rd,float id){
 if(uWorld>4.5)return signalSurface(p,n,rd,id);
 float t=uTime;vec3 cyan=vec3(.12,.62,.85),gold=vec3(1.,.55,.18),base=vec3(.04,.07,.09),em=vec3(0.);
 if(id>14.5&&id<15.5){
  vec2 uv=(p.xy-vec2(0.,6.))/vec2(15.7,8.83)+.5;uv.y=1.-uv.y;
  vec3 code=texture2D(uSource,uv).rgb*(1.-smoothstep(241.,245.,t));
  return preserve(mix(code,texture2D(uOutput,uv).rgb,step(252.063,t)));
 }
 if(id>19.5&&id<23.5){
  vec2 uv;vec3 image=vec3(0.);float sep=smoothstep(202.,206.,t)*(1.-smoothstep(212.,216.,t));
  if(t<114. || (t>=147.083&&t<148.903)){
   uv=(p.xy-vec2(0.,4.))/vec2(11.6,6.525)+.5;uv.y=1.-uv.y;
   uv=uPixel+(uv-.5)*.055;float a=texture2D(uField,uv).r;
   vec2 cell=fract(uv*vec2(960.,540.));float edge=step(.94,max(cell.x,cell.y));
   image=mix(vec3(.015,.035,.06),vec3(.65,.82,.88),a)+edge*vec3(.07,.22,.28);
  }else if(sep>.01){
   float x=id<21.5?-sep*7.5:id>22.5?sep*7.5:0.;float y=id>21.5&&id<22.5?4.+sep*.5:4.;
   uv=(p.xy-vec2(x,y))/vec2(6.2,3.4875)+.5;uv.y=1.-uv.y;
   uv=uPixel+(uv-.5)*.12;
   image=id<21.5?texture2D(uBackground,uv).rgb:id<22.5?vec3(texture2D(uField,uv).r)*vec3(.45,.8,1.):texture2D(uOutput,uv).rgb;
  }else{
   float zoom=1.-smoothstep(151.163,154.343,t),scale=mix(7.,2.,zoom);
   uv=(p.xy-vec2(0.,4.))/vec2(scale*2.,scale*1.125)+.5;uv.y=1.-uv.y;
   uv=mix(uv,uPixel+(uv-.5)*.018,zoom);
   float done=smoothstep(151.,241.863,t);done=.18+.82*done;
   float tile=floor(uv.y*18.)/18.;float reveal=1.-smoothstep(done-.01,done+.01,tile);
   image=mix(texture2D(uBackground,uv).rgb,texture2D(uOutput,uv).rgb,reveal);
   image+=vec3(.05,.16,.21)*exp(-abs(tile-done)*100.);
  }return preserve(image);
 }
 if(id>24.5){
  float stripe=mod(floor((p.x+.15)/.3),3.);vec3 rgb=stripe<.5?vec3(uRgb.r,0.,0.):stripe<1.5?vec3(0.,uRgb.g,0.):vec3(0.,0.,uRgb.b);
  return rgb*(.35+smoothstep(249.343,251.8,t)*2.5);
 }
 if(id<1.5)base=vec3(.015,.023,.035);
 else if(id<2.5){base=vec3(.025,.06,.075);em=cyan*circuit(p.xz)*.1;}
 else if(id<3.5)base=vec3(.32,.23,.12);
 else if(id<4.5)base=vec3(.025,.1,.14);
 else if(id<5.5)base=vec3(.045,.075,.12);
 else if(id<6.5)base=vec3(.09,.065,.13);
 else if(id<7.5)base=vec3(.035,.11,.095);
 else if(id<8.5)base=vec3(.16,.08,.04);
 else if(id<9.5)base=vec3(.35,.4,.44);
 else if(id<10.5){base=vec3(.4,.23,.08);em=gold*.11*smoothstep(61.163,61.32,t);}
 else if(id<11.5){base=vec3(.13,.16,.23);float on=p.z<0.?smoothstep(61.163,61.32,t):1.-smoothstep(61.163,61.32,t);em=cyan*on*.18;}
 else if(id<12.5){base=vec3(.1,.05,.08);em=mix(cyan,vec3(.9,.09,.16),step(121.623,t))*.06;}
 else if(id<13.5)base=vec3(.04,.12,.09);
 else if(id<14.5)base=vec3(.04,.055,.075);
 else if(id<16.5)base=vec3(.07,.09,.12);
 else if(id<17.5)base=vec3(.018,.025,.035);
 else if(id<18.5){base=vec3(.06,.27,.35);em=cyan*.1;}
 else if(id<19.5)base=vec3(.06,.075,.1);
 else if(id<24.5){base=vec3(.04,.1,.13);em=cyan*circuit(p.xz*3.)*.35*step(245.263,t);}
 float top=max(n.y,0.);
 if(id>3.5&&id<8.5){
  vec2 f=fract(p.xz*25.);float litho=exp(-min(abs(f.x-.5),abs(f.y-.5))*40.);
  base+=top*litho*vec3(.045,.08,.1);
  float flow=pow(.5+.5*sin(p.z*3.-t*4.+floor(p.x*2.)),18.);
  em+=top*flow*mix(cyan,gold,step(7.5,id))*.12;
 }
 if(id>11.5&&id<13.5){
  float lines=circuit(p.xz*4.);vec2 f=fract(p.xz*13.);
  float cells=step(.13,f.x)*step(f.x,.8)*step(.2,f.y)*step(f.y,.72);
  base+=top*(lines*.06+cells*.025)*vec3(.5,.75,1.);
  em+=top*lines*mix(cyan,gold,step(12.5,id))*.16;
 }
 if(uWorld>1.5&&uWorld<2.5){
  float machining=sin(p.x*160.)*sin(p.z*160.);base+=machining*.005;
  float rim=pow(1.-max(dot(n,-rd),0.),5.);em+=cyan*rim*.09;
 }
 float light=max(dot(n,normalize(vec3(-.5,1.,.3))),0.),fres=pow(1.-max(dot(-rd,n),0.),4.);
 vec3 reflection=env(reflect(rd,n));
 float spec=pow(max(dot(n,normalize(normalize(vec3(-.5,1.,.3))-rd)),0.),70.);
 vec3 color=base*(.22+light*.8)+reflection*(.35+fres*.65)+em+vec3(.7,.84,1.)*spec*.32;
 if(uWorld<1.5&&id<13.5)color*=.55+.45*exp(-length(p.xz-uTarget.xz)*.12);
 return color;
}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*uResolution)/uResolution.y;uv=rot(-uRoll)*uv;
 vec3 f=normalize(uTarget-uCamera),r=normalize(cross(f,vec3(0,1,0))),u=cross(r,f),rd=normalize(f*uLens*2.+r*uv.x*2.+u*uv.y*2.);
 vec3 col=env(rd)*.18,p=uCamera;float travel=0.;vec2 hit=vec2(0.);bool found=false;
 for(int i=0;i<90;i++){p=uCamera+rd*travel;hit=map(p);if(abs(hit.x)<.003){found=true;break;}travel+=max(abs(hit.x)*.8,.004);if(travel>100.)break;}
 if(found){vec2 e=vec2(.009,0.);vec3 n=normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x));if(dot(n,rd)>0.)n=-n;
  col=surface(p,n,rd,hit.y);
  if(hit.y<14.5||hit.y>23.5){float ao=clamp(map(p+n*.12).x/.12,.25,1.);col*=.7+.3*ao;}
 }
 col*=1.-smoothstep(.5,1.35,length(uv))*.2;
 col=pow(max(vec3(0.),1.-exp(-col*1.65)),vec3(.86));
 col*=1.-uCut*.7;col*=1.-smoothstep(278.,281.15,uTime)*.5;
 gl_FragColor=vec4(col,1.);
}`;
