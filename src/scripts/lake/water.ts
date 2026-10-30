import { clock, reducedMotion } from "./clock";

const vertex = `attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
const fragment = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution,u_texel;
uniform sampler2D u_state;
uniform float u_time,u_dark,u_sim,u_open;
uniform vec4 u_pulses[8];
uniform vec4 u_trail[8];
uniform vec4 u_burst;
float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.;v+=noise(p)*.55;p=mat2(.8,.6,-.6,.8)*p*2.1;v+=noise(p)*.27;v+=noise(p*2.03)*.14;return v;}
float stars(vec2 p,float scale,float threshold){
 vec2 grid=p*scale,id=floor(grid),f=fract(grid)-.5;
 float seed=hash(id+scale),visible=step(threshold,seed);
 vec2 center=vec2(hash(id+13.7),hash(id+71.3))*.7-.35;
 float d=length(f-center),size=mix(.012,.045,hash(id+7.));
 float point=exp(-d*d/(size*size));
 float glow=exp(-d*d/(size*size*12.))*.08;
 return (point+glow)*visible*(.76+.19*sin(u_time*(.35+seed*.5)+seed*100.));
}
vec3 sky(vec2 p){
 float cloud=fbm(p*2.1+vec2(u_time*.003,-u_time*.0008));
 vec3 color=mix(vec3(.065,.078,.12),vec3(.145,.155,.22),cloud);
 float band=exp(-pow((p.x*.45+p.y-.15)*2.2,2.));
 color+=vec3(.035,.028,.05)*band*fbm(p*5.+vec2(u_time*.001,0.));
 color+=stars(p+vec2(u_time*.00065,u_time*.00012),47.,.975)*vec3(.76,.69,.85)*.8;
 color+=stars(p+2.1-vec2(u_time*.00024,u_time*.00008),91.,.952)*vec3(.52,.48,.68)*.42;
 vec2 aspect=vec2(u_resolution.x/u_resolution.y,1.);
 for(int i=1;i<8;i++){
  float age=u_time-u_trail[i-1].z;
  if(age>=0.&&age<.55){
   vec2 a=(u_trail[i-1].xy-.5)*aspect,b=(u_trail[i].xy-.5)*aspect;
   vec2 delta=b-a;float length2=dot(delta,delta);
   if(length2<.055){float along=clamp(dot(p-a,delta)/max(length2,.000001),0.,1.);vec2 offset=p-a-delta*along;float d=dot(offset,offset);
    if(d<.0005){float fade=pow(1.-age/.55,2.);color+=vec3(.53,.55,.72)*(exp(-d/.000006)*.12+exp(-d/.00011)*.023)*fade;}
   }
  }
 }
 float meteorTime=mod(u_time+8.,23.);
 if(meteorTime<1.7){float cycle=floor((u_time+8.)/23.);vec2 start=vec2(hash(vec2(cycle,17.))-.5,.22+hash(vec2(cycle,37.))*.2)*aspect;vec2 head=start+vec2(.22,-.095)*meteorTime;vec2 delta=p-head;vec2 direction=normalize(vec2(.22,-.095));float along=dot(delta,direction);float crossway=abs(dot(delta,vec2(-direction.y,direction.x)));float streak=exp(-crossway*crossway/.0000012)*smoothstep(-.11,0.,along)*step(along,0.);color+=vec3(.3,.25,.39)*streak*sin(meteorTime/1.7*3.14159)*.3;}
 float age=u_time-u_burst.z;
 if(age>0.&&age<1.8){vec2 origin=(u_burst.xy-.5)*vec2(u_resolution.x/u_resolution.y,1.);float d=length(p-origin);color+=vec3(.13,.16,.24)*exp(-d*d*3.)*sin(min(age/1.8,1.)*3.14159)*.24;}
 return color;
}
void main(){
 vec2 aspect=vec2(u_resolution.x/u_resolution.y,1.);vec2 p=(v_uv-.5)*aspect;
 vec3 nightSky=vec3(0.);if(u_dark>.001)nightSky=sky(p);if(u_dark>.999){gl_FragColor=vec4(nightSky,1.);return;}
 vec2 gradient=vec2(0.);
 gradient+=vec2(.8,.6)*cos(dot(p,vec2(.8,.6))*18.-u_time*.55)*.038;
 gradient+=vec2(-.6,.8)*cos(dot(p,vec2(-.6,.8))*29.+u_time*.72)*.029;
 gradient+=vec2(.94,-.34)*cos(dot(p,vec2(.94,-.34))*47.-u_time*.91)*.015;
 gradient+=vec2(.3,.95)*cos(dot(p,vec2(.3,.95))*73.+u_time*1.1)*.007;
 if(u_sim>.5){gradient+=vec2(texture2D(u_state,v_uv-vec2(u_texel.x,0)).r-texture2D(u_state,v_uv+vec2(u_texel.x,0)).r,texture2D(u_state,v_uv-vec2(0,u_texel.y)).r-texture2D(u_state,v_uv+vec2(0,u_texel.y)).r )*.75;}
 for(int i=0;i<8;i++){
  float age=u_time-u_pulses[i].z;
  if(age>=0.&&age<3.8){vec2 offset=(v_uv-u_pulses[i].xy)*aspect;float r=length(offset);float e=r-age*.22;float envelope=exp(-e*e*320.)*exp(-age*1.35);float slope=(72.*cos(e*72.)-640.*e*sin(e*72.))*envelope*u_pulses[i].w*.0035;gradient+=offset/max(r,.0001)*slope;}
 }
 float burstAge=u_time-u_burst.z,burstLight=0.;
 if(burstAge>=0.&&burstAge<1.65){float t=clamp(burstAge/1.35,0.,1.);float progress=1.-pow(1.-t,3.);vec2 offset=(v_uv-u_burst.xy)*aspect;float r=length(offset);float e=r-progress*length(aspect)*1.1;float packet=exp(-e*e*900.);gradient+=offset/max(r,.0001)*sin(e*91.)*packet*.24*(1.-t);burstLight=packet*(1.-t)*.09;}
 vec3 normal=normalize(vec3(gradient,1.));vec3 view=normalize(vec3(.08,-.26,1.));vec3 light=normalize(vec3(-.22,.36,1.));
 vec2 refracted=p+normal.xy*.28;
 float bed=fbm(refracted*2.2+vec2(u_time*.007,-u_time*.003));
 float cloud=fbm(refracted*vec2(2.,3.4)+normal.xy*.7+vec2(u_time*.004,0.));
 float ribbons=pow(max(0.,1.-abs(cloud-.55)*4.),7.);
 float fresnel=.025+.975*pow(1.-max(0.,dot(normal,view)),5.);
 vec3 day=mix(vec3(.68,.81,.91),vec3(.84,.90,.96),bed);
 vec3 color=day;
 vec3 reflection=vec3(.99,.94,.86);
 color=mix(color,reflection,clamp(.1+ribbons*.18+fresnel*.65,0.,.9));
 float shine=pow(max(0.,dot(reflect(-light,normal),view)),92.);
 color+=vec3(.62,.69,.77)*shine*.20;
 float caustic=pow(max(0.,sin(refracted.x*41.+sin(refracted.y*17.)*.8+u_time*.21)+sin(refracted.y*34.-refracted.x*13.-u_time*.17)-1.18),3.);
 color+=vec3(.40,.46,.55)*caustic*.035*(1.-u_dark*.4);
 color+=burstLight*vec3(.72,.80,.95);
 color*=1.-smoothstep(.25,1.1,length(p/vec2(aspect.x,1.)))*.055;
 color*=1.-u_open*.025;color+=(hash(gl_FragCoord.xy)-.5)*.003;
 gl_FragColor=vec4(mix(pow(max(color,vec3(0.)),vec3(.95)),nightSky,u_dark),1.);
}`;
const simulation = `
precision highp float;varying vec2 v_uv;uniform sampler2D u_state;uniform vec2 u_texel;uniform vec4 u_drop;
void main(){vec4 current=texture2D(u_state,v_uv);float neighbors=texture2D(u_state,v_uv+vec2(u_texel.x,0)).r+texture2D(u_state,v_uv-vec2(u_texel.x,0)).r+texture2D(u_state,v_uv+vec2(0,u_texel.y)).r+texture2D(u_state,v_uv-vec2(0,u_texel.y)).r;
float next=(neighbors*.5-current.g)*.991;vec2 d=(v_uv-u_drop.xy)*vec2(u_texel.y/u_texel.x,1.);next+=exp(-dot(d,d)/max(.00001,u_drop.w*u_drop.w))*u_drop.z;
float edge=min(min(v_uv.x,1.-v_uv.x),min(v_uv.y,1.-v_uv.y));next*=smoothstep(0.,.04,edge);gl_FragColor=vec4(next,current.r,0.,1.);}`;

type GL = WebGLRenderingContext | WebGL2RenderingContext;
type Target = { texture: WebGLTexture; framebuffer: WebGLFramebuffer };
export interface WaterTransition {
	x: number;
	y: number;
	started: number;
	duration: number;
}

export class Water {
	private gl: GL;
	private modern: boolean;
	private scene: WebGLProgram;
	private solver?: WebGLProgram;
	private front?: Target;
	private back?: Target;
	private simWidth = 1;
	private simHeight = 1;
	private accumulator = 0;
	private activeUntil = 0;
	private texture: WebGLTexture;
	private locations = new Map<string, WebGLUniformLocation | null>();
	private queue: number[][] = [];
	private pulses = new Float32Array(32);
	private trailPoints = new Float32Array(32);
	private pulseIndex = 0;
	private burst = new Float32Array([0.5, 0.5, -100, 0]);
	private time = 0;
	private dark = 1;
	private targetDark = 1;
	private open = 0;
	private targetOpen = 0;
	private dirty = true;
	private lost = false;
	private width = 1;
	private height = 1;
	transition?: WaterTransition;
	constructor(private canvas: HTMLCanvasElement) {
		const options = {
			alpha: false,
			antialias: false,
			depth: false,
			stencil: false,
			preserveDrawingBuffer: false,
			powerPreference: "high-performance" as const,
		};
		const modern = canvas.getContext("webgl2", options);
		const context = (modern ||
			canvas.getContext("webgl", options)) as GL | null;
		if (!context) throw Error("WebGL unavailable");
		this.gl = context;
		this.modern = !!modern;
		const gl = this.gl;
		this.scene = this.program(vertex, fragment);
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 3, -1, -1, 3]),
			gl.STATIC_DRAW,
		);
		this.texture = gl.createTexture()!;
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			1,
			1,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			new Uint8Array(4),
		);
		this.textureOptions();
		for (let i = 0; i < 8; i++) {
			this.pulses[i * 4 + 2] = -100;
			this.trailPoints[i * 4 + 2] = -100;
		}
		if (modern && gl.getExtension("EXT_color_buffer_float")) {
			try {
				this.solver = this.program(vertex, simulation);
			} catch {
				this.solver = undefined;
			}
		}
		this.targetDark =
			document.documentElement.dataset.theme === "dark" ? 1 : 0;
		this.dark = this.targetDark;
		this.updateView();
		this.open = this.targetOpen;
		this.resize();
		window.addEventListener("resize", () => this.resize(), {
			passive: true,
		});
		canvas.addEventListener("webglcontextlost", (event) => {
			event.preventDefault();
			this.lost = true;
			canvas.parentElement?.classList.remove("has-water");
		});
		canvas.addEventListener("webglcontextrestored", () =>
			location.reload(),
		);
		const observer = new MutationObserver(() => {
			this.targetDark =
				document.documentElement.dataset.theme === "dark" ? 1 : 0;
			this.dirty = true;
			clock.wake();
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme"],
		});
		reducedMotion.addEventListener("change", () => {
			this.dirty = true;
			clock.wake();
		});
		clock.add(this.frame);
		canvas.parentElement?.classList.add("has-water");
	}
	private source(source: string, fragmentShader: boolean) {
		if (!this.modern) return source;
		return (
			"#version 300 es\n" +
			(fragmentShader ? "out highp vec4 fragColor;\n" : "") +
			source
				.replace(/attribute /g, "in ")
				.replace(/varying /g, fragmentShader ? "in " : "out ")
				.replace(/texture2D/g, "texture")
				.replace(/gl_FragColor/g, "fragColor")
		);
	}
	private program(v: string, f: string) {
		const gl = this.gl;
		const compile = (type: number, source: string) => {
			const shader = gl.createShader(type)!;
			gl.shaderSource(
				shader,
				this.source(source, type === gl.FRAGMENT_SHADER),
			);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
				throw Error(gl.getShaderInfoLog(shader) || "water shader");
			return shader;
		};
		const vs = compile(gl.VERTEX_SHADER, v),
			fs = compile(gl.FRAGMENT_SHADER, f),
			program = gl.createProgram()!;
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);
		gl.deleteShader(vs);
		gl.deleteShader(fs);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS))
			throw Error(gl.getProgramInfoLog(program) || "water program");
		return program;
	}
	private textureOptions() {
		const gl = this.gl;
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
	private target(): Target {
		const gl = this.gl as WebGL2RenderingContext,
			texture = gl.createTexture()!,
			framebuffer = gl.createFramebuffer()!;
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA16F,
			this.simWidth,
			this.simHeight,
			0,
			gl.RGBA,
			gl.HALF_FLOAT,
			null,
		);
		this.textureOptions();
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			texture,
			0,
		);
		if (
			gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
			gl.FRAMEBUFFER_COMPLETE
		)
			throw Error("water framebuffer");
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		return { texture, framebuffer };
	}
	private uniform(program: WebGLProgram, name: string) {
		const key = (program === this.scene ? "scene:" : "sim:") + name;
		if (!this.locations.has(key))
			this.locations.set(key, this.gl.getUniformLocation(program, name));
		return this.locations.get(key)!;
	}
	private use(program: WebGLProgram) {
		const gl = this.gl;
		gl.useProgram(program);
		const attribute = gl.getAttribLocation(program, "a_position");
		gl.enableVertexAttribArray(attribute);
		gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
	}
	private resize() {
		const gl = this.gl,
			ratio = Math.min(
				devicePixelRatio || 1,
				innerWidth < 700 ? 1.15 : 1.35,
			);
		this.width = this.canvas.width = Math.round(innerWidth * ratio);
		this.height = this.canvas.height = Math.round(innerHeight * ratio);
		if (this.solver) {
			for (const target of [this.front, this.back])
				if (target) {
					gl.deleteTexture(target.texture);
					gl.deleteFramebuffer(target.framebuffer);
				}
			this.simWidth = Math.min(
				480,
				Math.max(192, Math.round(innerWidth / 3)),
			);
			this.simHeight = Math.max(
				128,
				Math.round((this.simWidth * innerHeight) / innerWidth),
			);
			try {
				this.front = this.target();
				this.back = this.target();
			} catch {
				this.front = this.back = undefined;
				this.solver = undefined;
			}
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		this.dirty = true;
		clock.wake();
	}
	updateView() {
		this.targetOpen =
			document.body.dataset.view === "home"
				? 0
				: document.body.dataset.view === "reading" &&
					  document.body.dataset.space !== "overview"
					? 1
					: 0.25;
		this.dirty = true;
		clock.wake();
	}
	ripple(x: number, y: number, strength = 0.45) {
		if (
			reducedMotion.matches ||
			this.targetDark > 0.5 ||
			(document.body.dataset.view === "reading" &&
				document.body.dataset.space !== "overview")
		)
			return;
		const point = [x / innerWidth, 1 - y / innerHeight];
		const offset = (this.pulseIndex++ % 8) * 4;
		this.pulses.set([point[0], point[1], this.time, strength], offset);
		this.queue.push([point[0], point[1], strength * 0.1, 0.012]);
		if (this.queue.length > 8) this.queue.shift();
		this.activeUntil = this.time + 6;
		this.dirty = true;
		clock.wake();
	}
	trail(x: number, y: number) {
		if (
			reducedMotion.matches ||
			this.targetDark < 0.5 ||
			(document.body.dataset.view === "reading" &&
				document.body.dataset.space !== "overview")
		)
			return;
		this.trailPoints.copyWithin(0, 4);
		this.trailPoints.set(
			[x / innerWidth, 1 - y / innerHeight, this.time, 1],
			28,
		);
		this.dirty = true;
		clock.wake();
	}

	reveal(x: number, y: number) {
		this.transition = { x, y, started: performance.now(), duration: 1350 };
		this.burst.set([x / innerWidth, 1 - y / innerHeight, this.time, 1]);
		this.ripple(x, y, 0.75);
		this.dirty = true;
		clock.wake();
		return this.transition;
	}
	private frame = (time: number, dt: number) => {
		this.time = time;
		if (this.lost) return false;
		const reduced = reducedMotion.matches;
		const moving =
			Math.abs(this.dark - this.targetDark) +
				Math.abs(this.open - this.targetOpen) >
			0.001;
		const animate =
			!reduced &&
			document.body.dataset.space !== "overview" &&
			(document.body.dataset.view !== "reading" ||
				document.body.dataset.space === "overview" ||
				time - this.burst[2] < 1.8);
		if (!animate && !this.dirty && !moving) return false;
		const gl = this.gl;
		this.dark = reduced
			? this.targetDark
			: this.dark +
				(this.targetDark - this.dark) * (1 - Math.exp(-dt * 2.5));
		this.open = reduced
			? this.targetOpen
			: this.open +
				(this.targetOpen - this.open) * (1 - Math.exp(-dt * 3));
		if (
			this.targetDark < 0.5 &&
			this.solver &&
			this.front &&
			this.back &&
			!reduced &&
			time < this.activeUntil
		) {
			this.accumulator = Math.min(this.accumulator + dt, 0.066);
			let steps = 0;
			while (this.accumulator >= 1 / 60 && steps++ < 3) {
				this.accumulator -= 1 / 60;
				this.use(this.solver);
				gl.bindFramebuffer(gl.FRAMEBUFFER, this.back.framebuffer);
				gl.viewport(0, 0, this.simWidth, this.simHeight);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.front.texture);
				gl.uniform1i(this.uniform(this.solver, "u_state"), 0);
				gl.uniform2f(
					this.uniform(this.solver, "u_texel"),
					1 / this.simWidth,
					1 / this.simHeight,
				);
				gl.uniform4fv(
					this.uniform(this.solver, "u_drop"),
					this.queue.shift() || [0, 0, 0, 0.01],
				);
				gl.drawArrays(gl.TRIANGLES, 0, 3);
				[this.front, this.back] = [this.back, this.front];
			}
		}
		this.use(this.scene);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, this.width, this.height);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.front?.texture || this.texture);
		gl.uniform1i(this.uniform(this.scene, "u_state"), 0);
		gl.uniform2f(
			this.uniform(this.scene, "u_resolution"),
			this.width,
			this.height,
		);
		gl.uniform2f(
			this.uniform(this.scene, "u_texel"),
			1 / this.simWidth,
			1 / this.simHeight,
		);
		gl.uniform1f(this.uniform(this.scene, "u_sim"), this.front ? 1 : 0);
		gl.uniform1f(this.uniform(this.scene, "u_time"), reduced ? 0 : time);
		gl.uniform1f(this.uniform(this.scene, "u_dark"), this.dark);
		gl.uniform1f(this.uniform(this.scene, "u_open"), this.open);
		gl.uniform4fv(this.uniform(this.scene, "u_pulses[0]"), this.pulses);
		gl.uniform4fv(this.uniform(this.scene, "u_burst"), this.burst);
		gl.uniform4fv(this.uniform(this.scene, "u_trail[0]"), this.trailPoints);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		this.dirty = false;
		return animate || moving;
	};
}
