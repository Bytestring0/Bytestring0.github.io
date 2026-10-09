import subprocess, json, pathlib
import numpy as np

root = pathlib.Path(__file__).resolve().parents[1]
src = root / 'src/content/posts/杂项/ray.mp3'
sr, hop, nfft = 12000, 240, 1024
raw = subprocess.run(['ffmpeg','-v','error','-i',str(src),'-f','f32le','-ac','1','-ar',str(sr),'-'],capture_output=True,check=True).stdout
y = np.frombuffer(raw,dtype='<f4')
frames = np.lib.stride_tricks.sliding_window_view(y,nfft)[::hop]
spec = np.abs(np.fft.rfft(frames * np.hanning(nfft),axis=1)).astype(np.float32)
freq = np.fft.rfftfreq(nfft,1/sr)
bands = [(35,180),(180,2000),(2000,5800)]
energy = np.stack([np.sqrt(np.mean(spec[:,(freq>=a)&(freq<b)]**2,axis=1)) for a,b in bands],axis=1)
flux = np.maximum(np.diff(np.log1p(spec),axis=0,prepend=np.log1p(spec[:1])),0)
onsets = np.stack([np.mean(flux[:,(freq>=a)&(freq<b)],axis=1) for a,b in bands],axis=1)
strength = onsets[:,0]*.5+onsets[:,1]*.3+onsets[:,2]*.2
strength = np.maximum(strength - np.convolve(strength,np.ones(51)/51,mode='same'),0)
scores=[]
for lag in range(15,44):
    corr = sum(float(np.dot(strength[:-lag*k],strength[lag*k:]))/k for k in (1,2,3,4))
    scores.append((corr,60*sr/(hop*lag),lag))
scores.sort(reverse=True)
peaks=[i for i in range(1,len(strength)-1) if strength[i]>strength[i-1] and strength[i]>=strength[i+1] and strength[i]>np.quantile(strength,.68)]
kept=[]
for i in peaks:
    if kept and i-kept[-1]<7:
        if strength[i]>strength[kept[-1]]: kept[-1]=i
    else: kept.append(i)
scale=np.maximum(np.quantile(energy,.97,axis=0),.0001)
norm=np.minimum(energy/scale,1.4)
events=[[round(i*hop/sr+nfft/sr/2,3),round(float(strength[i]/max(strength.max(),.001)),3)] for i in kept]
envelope=[[round(float(x),3) for x in row] for row in norm[::5]]
out={'duration':round(len(y)/sr,4),'envelopeStep':.1,'envelope':envelope,'onsets':events,'tempoCandidates':[[round(bpm,2),round(score,3)] for score,bpm,lag in scores[:8]],'analysis':'Local FFT, 35–180 / 180–2000 / 2000–5800 Hz; spectral-flux transients. No lyric transcription.'}
# Refine the coarse tempo by aligning a continuous pulse grid to the actual flux.
times=np.arange(len(strength))*hop/sr+nfft/sr/2
gridScores=[]
for bpm in np.arange(126,138,.02):
    period=60/bpm
    phases=np.arange(0,period,.005)
    sums=[]
    for phase in phases:
        grid=np.arange(16+phase,270,period)
        sums.append(float(np.mean(np.interp(grid,times,strength))))
    i=int(np.argmax(sums))
    gridScores.append((sums[i],float(bpm),float(16+phases[i])))
best=max(gridScores)
out['bpm']=round(best[1],2)
out['beatOffset']=round(best[2]%(60/best[1]),4)
# Pitch-class contours describe harmonic motion rather than claiming isolated vocal notes.
valid=(freq>=130)&(freq<3500)
midi=np.rint(69+12*np.log2(np.maximum(freq[valid],1)/440)).astype(int)
chroma=np.stack([np.sum(spec[:,valid][:,midi%12==pc]**.7,axis=1) for pc in range(12)],axis=1)
chroma/=np.maximum(chroma.max(axis=1,keepdims=True),.0001)
out['chromaStep']=.2
out['chroma']=[[round(float(v),2) for v in row] for row in chroma[::10]]
print('REFINED BPM',out['bpm'],'OFFSET',out['beatOffset'])
(root/'src/components/article-designs/ray/analysis.json').write_text(json.dumps(out,separators=(',',':')),encoding='utf8')
print('DURATION',out['duration'],'TEMPO',out['tempoCandidates'],'ONSETS',len(events))
for start in range(0,int(len(y)/sr),8):
    a,b=int(start*sr/hop),int((start+8)*sr/hop)
    print(start, np.round(np.mean(norm[a:b],axis=0),2).tolist(), 'hits',sum(start<=t<start+8 for t,s in events))
