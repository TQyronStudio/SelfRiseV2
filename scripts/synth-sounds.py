# Candidate sounds for the feel vocabulary (kolo 50, O-12) — see assets/sounds/README.md.
# Usage: python3 scripts/synth-sounds.py assets/sounds  (writes WAV; convert with ffmpeg -c:a aac -b:a 96k)
import numpy as np, wave, sys, os
SR=44100
def note(freq, dur, start, amp=1.0, kind='bell'):
    n=int(SR*dur); t=np.arange(n)/SR
    if kind=='bell':   # soft glass bell: fundamental + inharmonic partials, long decay
        parts=[(1.0,1.0,2.2),(2.0,0.32,3.6),(3.01,0.12,5.5),(4.17,0.06,8.0)]
    else:              # marimba-ish: warm, quick decay
        parts=[(1.0,1.0,6.0),(3.92,0.18,14.0),(9.0,0.03,30.0)]
    y=np.zeros(n)
    for mul,a,dec in parts:
        y+=a*np.sin(2*np.pi*freq*mul*t)*np.exp(-dec*t)
    att=int(SR*0.006); y[:att]*=np.linspace(0,1,att)   # no click
    return start, amp*y
def mix(notes, total):
    out=np.zeros(int(SR*total))
    for start,y in notes:
        s=int(SR*start); e=min(len(out), s+len(y)); out[s:e]+=y[:e-s]
    return out
def room(y, delay=0.045, fb=0.25, wet=0.18):
    d=int(SR*delay); out=y.copy()
    for i in range(d, len(out)): out[i]+=fb*out[i-d]
    return (1-wet)*y+wet*out
def finish(y, peak_db=-14.0):
    fade=int(SR*0.08); y[-fade:]*=np.linspace(1,0,fade)
    y=y/np.max(np.abs(y))*10**(peak_db/20); return y
def write(name, y):
    p=os.path.join(sys.argv[1], name+'.wav')
    with wave.open(p,'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((y*32767).astype(np.int16).tobytes())
f=lambda m: 440*2**((m-69)/12)
# celebrate — trophy & streak windows: two notes up a major third, marimba
write('celebrate', finish(room(mix([note(f(76),0.7,0,1,'marimba'),note(f(80),0.9,0.11,0.9,'marimba')],1.0))))
# chapter — the rarest: an arpeggio up an octave, glass bell
write('chapter', finish(room(mix([note(f(72),1.4,0,0.8),note(f(76),1.3,0.12,0.75),note(f(79),1.2,0.24,0.75),note(f(84),1.3,0.38,0.85)],1.7),fb=0.3,wet=0.22)))
# complete — challenge finished: a soft chord, bell
write('complete', finish(room(mix([note(f(72),1.1,0,0.8),note(f(76),1.1,0.03,0.6),note(f(79),1.1,0.06,0.6)],1.2))))
# boost — multiplier on: quick bright fifth up, marimba
write('boost', finish(room(mix([note(f(79),0.45,0,0.9,'marimba'),note(f(86),0.6,0.08,0.9,'marimba')],0.75))))
print('ok')
