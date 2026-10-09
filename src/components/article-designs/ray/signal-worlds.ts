export const signalWorlds = `
float sphere(vec3 p,float r){return length(p)-r;}
float torus(vec3 p,vec2 r){return length(vec2(length(p.xy)-r.x,p.z))-r.y;}
vec2 sensor(vec3 p){
 vec3 q=p-vec3(0.,4.,0.);float open=1.-smoothstep(25.,34.,uTime);
 if(uTime>50.)open=1.;
 vec2 d=vec2(torus(q-vec3(0.,0.,3.),vec2(3.1,.32)),30.);
 d=near(d,vec2(torus(q-vec3(0.,0.,1.8),vec2(2.8,.2)),31.));
 d=near(d,vec2(torus(q-vec3(0.,0.,4.),vec2(2.9,.11)),32.));
 for(int i=0;i<8;i++){
  vec3 blade=q-vec3(0.,0.,2.6);blade.xy=rot(float(i)*.785398+open*.5)*blade.xy;
  blade.xy-=vec2(2.1+open*.35,.6);blade.xy=rot(.6+open*.4)*blade.xy;
  d=near(d,vec2(box(blade,vec3(.9,.25,.045)),31.));
 }
 // The lens and its rear focal plane share a real optical axis.
 d=near(d,vec2(max(sphere(q-vec3(0.,0.,2.8),2.6),abs(q.z-2.8)-.055),33.));
 vec3 housing=p-vec3(0.,4.,-.6);
 d=near(d,vec2(max(box(housing,vec3(3.2,2.05,.2)),-box(housing,vec3(2.9,1.65,.4))),30.));
 vec3 cell=vec3(mod(q.x+.09,.18)-.09,mod(q.y+.09,.18)-.09,q.z+.3);
 d=near(d,vec2(max(box(cell,vec3(.076,.076,.03)),box(q-vec3(0.,0.,-.3),vec3(2.9,1.63,.06))),34.));
 for(int j=0;j<4;j++){
  float x=(float(j)-1.5)*1.3;
  d=near(d,obj(p,vec3(x,1.35,-1.2),vec3(.42,.18,.5),35.));
 }
 return d;
}
vec2 network(vec3 p){
 vec2 d=obj(p,vec3(0.,-.5,0.),vec3(14.,.15,13.),30.);
 // Six separate relay racks, each with bays, ventilation, and uplink ports.
 for(int i=0;i<6;i++){
  float a=float(i)*1.047198;vec3 center=vec3(cos(a)*9.,3.2,sin(a)*9.);
  vec3 q=p-center;q.xz=rot(-a)*q.xz;
  d=near(d,vec2(box(q,vec3(1.15,3.4,1.5)),36.));
  vec3 bay=vec3(q.x,mod(q.y+.4,.8)-.4,q.z-1.52);
  d=near(d,vec2(max(box(bay,vec3(.92,.3,.04)),box(q-vec3(0.,0.,1.52),vec3(1.,3.2,.08))),37.));
 }
 d=near(d,obj(p,vec3(0.,.7,0.),vec3(2.3,.5,2.3),38.));
 d=near(d,obj(p,vec3(0.,1.28,0.),vec3(2.,.05,2.),35.));
 return d;
}
vec2 intelligence(vec3 p){
 vec2 d=vec2(100.,30.);
 // Five tensor planes, not a CPU die. Open spacing permits a fly-through.
 for(int i=0;i<5;i++){
  float z=(float(i)-2.)*3.2;vec3 q=p-vec3(0.,4.,z);
  float breathe=uTime>129.&&uTime<139.8?sin(uTime*.4)*.13:0.;
  q.xy=rot((float(i)-2.)*.035+breathe)*q.xy;
  vec3 cell=vec3(mod(q.x+.38,.76)-.38,mod(q.y+.38,.76)-.38,q.z);
  d=near(d,vec2(max(box(cell,vec3(.29,.29,.035)),box(q,vec3(4.3,2.7,.08))),39.));
  d=near(d,vec2(max(box(q,vec3(4.6,2.95,.055)),-box(q,vec3(4.4,2.75,.2))),30.));
 }
 return d;
}
vec2 archive(vec3 p){
 vec2 d=vec2(100.,30.);float sealed=smoothstep(27.983,38.903,uTime);
 // A captured image becomes a thin glass plate inside a cassette. Other
 // plates are memories; the marked one remains identifiable through copies.
 for(int i=0;i<9;i++){
  float z=(float(i)-4.)*1.15;vec3 q=p-vec3(0.,4.,z);
  float unfold=uTime>157.?smoothstep(157.,163.,uTime):1.-sealed;
  q.xy=rot((float(i)-4.)*.025*unfold)*q.xy;
  if(i==4)d=near(d,vec2(box(q,vec3(4.2,2.3625,.018)),40.));
  else d=near(d,vec2(box(q-vec3(-3.6,-2.,0.),vec3(.5,.17,.018)),41.));
  d=near(d,vec2(max(box(q,vec3(4.35,2.51,.04)),-box(q,vec3(4.22,2.38,.1))),32.));
 }
 d=near(d,obj(p,vec3(0.,1.25,0.),vec3(4.6,.2,5.6),30.));
 return d;
}
vec2 memoryGalaxy(vec3 p){
 // The star positions are projected by the companion overlay from the real
 // memory input. Here a ring of image tiles forms the final output chamber.
 vec2 d=vec2(100.,30.);
 if(uTime>230.9){
  float assemble=smoothstep(230.943,241.863,uTime);
  for(int i=0;i<12;i++){
   float a=float(i)*.523599;vec3 center=vec3(cos(a)*10.*(1.-assemble),4.+sin(a)*5.*(1.-assemble),-5.);
   center.xy+=vec2((mod(float(i),4.)-1.5)*3.2,(floor(float(i)/4.)-1.)*1.8)*assemble;
   d=near(d,obj(p,center,vec3(1.59,.895,.025),42.+float(i)));
  }
 }
 return d;
}
vec2 signalMap(vec3 p){if(uWorld<5.5)return sensor(p);if(uWorld<6.5)return network(p);if(uWorld<7.5)return intelligence(p);if(uWorld<8.5)return archive(p);return memoryGalaxy(p);}
vec3 signalSurface(vec3 p,vec3 n,vec3 rd,float id){
 vec3 blue=vec3(.13,.65,.85),gold=vec3(1.,.45,.13),violet=vec3(.55,.27,.9);
 vec3 base=vec3(.05,.065,.085),em=vec3(0.);float t=uTime;
 if(id>41.5){
  float tile=id-42.,a=tile*.523599,done=smoothstep(230.943,241.863,t);
  vec2 center=vec2(cos(a)*10.,sin(a)*5.)*(1.-done)+vec2((mod(tile,4.)-1.5)*3.2,(floor(tile/4.)-1.)*1.8)*done;
  vec2 uv=(p.xy-vec2(0.,4.)-center)/vec2(3.18,1.79)+.5;uv.y=1.-uv.y;
  uv=(uv+vec2(mod(tile,4.),2.-floor(tile/4.)))/vec2(4.,3.);
  return preserve(texture2D(uOutput,uv).rgb);
 }
 if(id>39.5){
  vec2 uv=(p.xy-vec2(0.,4.))/vec2(8.4,4.725)+.5;uv.y=1.-uv.y;
  vec3 bg=texture2D(uBackground,uv).rgb;
  float a=texture2D(uField,uv).r;
  if(id<40.5)em=bg*.45+vec3(.25,.6,.8)*a*.5;
  else em=bg*.075;
  base=vec3(.008,.022,.035);
 }
 else if(id>38.5){
  vec3 q=p-vec3(0.,4.,0.);vec2 cell=floor((q.xy+vec2(.38))/.76);
  float layer=floor((q.z+6.4)/3.2+.5),weight=hash(cell+layer*7.);
  float arrive=smoothstep(layer*1.2,layer*1.2+.7,mod(max(t-85.263,0.),14.56));
  if(t>129.&&t<136.1)arrive=.12;
  em=mix(blue,violet,weight)*(.03+weight*.5*arrive);
  base=vec3(.045,.025,.07);
 }
 else if(id>37.5){base=vec3(.08,.045,.025);em=gold*circuit(p.xz*2.)*.3;}
 else if(id>36.5){
  float slot=step(.8,fract(p.y*8.));float led=step(.65,fract(p.x*4.));
  em=mix(blue,gold,step(85.263,t))*(slot*led*.5);base=vec3(.045,.075,.09);
  float fan=abs(length(vec2(fract(p.x*1.5)-.5,fract(p.y*1.25)-.5))-.25);base+=exp(-fan*75.)*.04;
 }
 else if(id>35.5)base=vec3(.035,.045,.06);
 else if(id>34.5){base=vec3(.05,.1,.075);em=blue*circuit(p.xz*4.)*.22;}
 else if(id>33.5){
  vec2 uv=(p.xy-vec2(0.,4.))/vec2(5.8,3.26)+.5;uv.y=1.-uv.y;
  float cov=texture2D(uField,uv).r;
  float scan=exp(-abs(uv.y-fract(t*.22))*100.);
  em=blue*(.03+cov*.38)+gold*scan*.45;base=vec3(.025,.065,.095);
 }
 else if(id>32.5){
  float fres=pow(1.-abs(dot(n,-rd)),3.);em=blue*fres*.4;base=vec3(.018,.045,.075);
  em+=gold*pow(max(dot(reflect(rd,n),normalize(vec3(-.3,.4,1.))),0.),60.);
 }
 else if(id>31.5){base=vec3(.32,.21,.1);em=gold*.045;}
 else if(id>30.5)base=vec3(.11,.13,.15);
 float light=max(dot(n,normalize(vec3(-.6,1.,.7))),0.),fres=pow(1.-max(dot(n,-rd),0.),4.);
 float spec=pow(max(dot(n,normalize(normalize(vec3(-.6,1.,.7))-rd)),0.),90.);
 return base*(.25+light*.75)+env(reflect(rd,n))*(.3+fres*.8)+em+vec3(.65,.8,1.)*spec*.5;
}
`;
