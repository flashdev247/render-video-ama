#!/usr/bin/env python3
"""Tạo nhạc nền và hiệu ứng âm thanh bằng code (không lo bản quyền) cho bộ dựng video.

python3 scripts/make-audio.py   (cần numpy + ffmpeg; chỉ chạy khi muốn đổi âm thanh, kết quả đã commit)

Ra: assets/music/{upbeat,corporate,warm}.mp3 (vòng lặp liền mạch, render.mjs tự lặp đủ thời lượng)
    assets/sfx/{whoosh,pop,ding,hit,click,zap,tick,ting,type}.mp3
"""
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
rng = np.random.default_rng(7)

NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(name: str, octave: int) -> float:
    return 440.0 * 2 ** ((NOTE[name] + 12 * (octave - 4) - 9) / 12)


def t_axis(sec: float) -> np.ndarray:
    return np.arange(int(sec * SR)) / SR


def lowpass(x: np.ndarray, cutoff) -> np.ndarray:
    """Lọc thông thấp một cực; cutoff là số hoặc mảng (Hz) theo thời gian."""
    cut = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * cut / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def highpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    return x - lowpass(x, cutoff)


# ---------------- Nhạc cụ ----------------
def kick(vol=1.0):
    t = t_axis(0.32)
    freq = 45 + 75 * np.exp(-t * 28)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return vol * np.sin(phase) * np.exp(-t * 9)


def clap(vol=0.5):
    t = t_axis(0.18)
    n = highpass(rng.standard_normal(len(t)), 900)
    env = np.exp(-t * 22) * (1 + 0.6 * np.exp(-((t - 0.012) ** 2) / 0.00002))
    return vol * n * env * 0.5


def hat(vol=0.18, length=0.05):
    t = t_axis(length)
    return vol * highpass(rng.standard_normal(len(t)), 6000) * np.exp(-t * 70)


def bass(f, length, vol=0.5):
    t = t_axis(length)
    w = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    env = np.minimum(t / 0.01, 1) * np.exp(-t * 4)
    return vol * w * env


def pluck(f, length, vol=0.28, bright=1.0):
    t = t_axis(length)
    w = sum(np.sin(2 * np.pi * k * f * t) / k * np.exp(-t * (4 + k * 2.2 / bright)) for k in range(1, 9))
    return vol * w * np.minimum(t / 0.004, 1)


def pad(freqs, length, vol=0.12):
    t = t_axis(length)
    w = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t) for f in freqs)
    env = np.minimum(t / 0.35, 1) * np.minimum((length - t) / 0.25, 1)
    return vol * w * np.clip(env, 0, 1) / len(freqs)


def place(track, clip, at):
    i = int(at * SR)
    end = min(len(track), i + len(clip))
    track[i:end] += clip[: end - i]


# ---------------- Bản nhạc ----------------
def song(bpm, chords, bars=16, drums=1.0, arp=True, pad_vol=0.12, bright=1.0):
    beat = 60 / bpm
    bar = beat * 4
    total = bars * bar
    mix = np.zeros(int(total * SR) + SR)
    for b in range(bars):
        root, quality = chords[b % len(chords)]
        r = NOTE[root]
        third = 3 if quality == "m" else 4
        tones = [r, r + third, r + 7]
        start = b * bar
        fs = [hz([k for k, v in NOTE.items() if v == (n % 12)][0], 4 + n // 12) for n in tones]
        place(mix, pad(fs, bar, pad_vol), start)
        # Bass: nốt gốc theo móc đơn
        for i in range(8):
            if i in (0, 3, 4, 6):
                place(mix, bass(hz(root, 2), beat * 0.9), start + i * beat / 2)
        # Arpeggio từ ô nhịp 5 trở đi
        if arp and b >= 4:
            seq = [0, 1, 2, 1, 2, 0, 1, 2]
            for i, s in enumerate(seq):
                n = tones[s] + (12 if (i // 4) % 2 else 0)
                f = hz([k for k, v in NOTE.items() if v == (n % 12)][0], 5 + n // 12)
                place(mix, pluck(f, beat * 0.9, bright=bright), start + i * beat / 2)
        # Trống (ô nhịp đầu chỉ hi-hat để vào nhẹ)
        if drums:
            for i in range(4):
                if b >= 1 and i in (0, 2):
                    place(mix, kick(drums), start + i * beat)
                if b >= 2 and i in (1, 3):
                    place(mix, clap(0.45 * drums), start + i * beat)
            for i in range(8):
                place(mix, hat(0.16 * drums if i % 2 else 0.09 * drums), start + i * beat / 2)
    # Vòng lặp liền: phần tràn sau ô nhịp cuối cộng về đầu
    tail = mix[int(total * SR):]
    mix = mix[: int(total * SR)]
    mix[: len(tail)] += tail
    mix = np.tanh(mix * 1.2)
    return mix / np.max(np.abs(mix)) * 0.89


# ---------------- Hiệu ứng ----------------
def whoosh():
    t = t_axis(0.5)
    cut = 300 + 5000 * np.sin(np.pi * np.clip(t / 0.5, 0, 1)) ** 2
    n = lowpass(rng.standard_normal(len(t)), cut)
    env = np.sin(np.pi * np.clip(t / 0.5, 0, 1)) ** 1.5
    return n * env


def pop():
    t = t_axis(0.12)
    f = 420 + 900 * (t / 0.12)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38)


def ding():
    t = t_axis(1.1)
    return (np.sin(2 * np.pi * 1568 * t) + 0.5 * np.sin(2 * np.pi * 2352 * t) + 0.25 * np.sin(2 * np.pi * 3136 * t)) * np.exp(-t * 5)


def hit():
    t = t_axis(0.5)
    low = np.sin(2 * np.pi * (55 + 60 * np.exp(-t * 20)) * t) * np.exp(-t * 7)
    noise = lowpass(rng.standard_normal(len(t)), 1800) * np.exp(-t * 25)
    return low + 0.6 * noise


def click():
    t = t_axis(0.04)
    return (np.sin(2 * np.pi * 2200 * t) + 0.5 * rng.standard_normal(len(t))) * np.exp(-t * 160)


def zap():
    t = t_axis(0.35)
    f = 900 - 600 * (t / 0.35)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    buzz = saw * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 38 * t)))
    return lowpass(buzz + 0.3 * rng.standard_normal(len(t)), 4000) * np.exp(-t * 7) * np.minimum(t / 0.01, 1)


def tick():
    """Tích tắc đồng hồ đếm ngược (mẫu đố vui)."""
    t = t_axis(0.09)
    return (np.sin(2 * np.pi * 1800 * t) + 0.4 * rng.standard_normal(len(t))) * np.exp(-t * 90)


def ting():
    """Tin nhắn đến (mẫu khung chat): hai nốt cao ngắn."""
    a = t_axis(0.18)
    b = t_axis(0.5)
    first = np.sin(2 * np.pi * 1318.5 * a) * np.exp(-a * 22)
    second = (np.sin(2 * np.pi * 1975.5 * b) + 0.3 * np.sin(2 * np.pi * 3951 * b)) * np.exp(-b * 9)
    out = np.zeros(int(0.62 * SR))
    place(out, first, 0)
    place(out, second, 0.11)
    return out


def type_key():
    """Gõ phím (mẫu dựng web): tiếng tách ngắn, hơi trầm hơn click."""
    t = t_axis(0.05)
    return (0.7 * np.sin(2 * np.pi * 900 * t) + rng.standard_normal(len(t))) * np.exp(-t * 120)


def save(audio: np.ndarray, path: Path, peak=0.9):
    path.parent.mkdir(parents=True, exist_ok=True)
    audio = audio / (np.max(np.abs(audio)) + 1e-9) * peak
    stereo = np.repeat((audio * 32767).astype(np.int16)[:, None], 2, axis=1)
    wav = path.with_suffix(".wav")
    with wave.open(str(wav), "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(stereo.tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-b:a", "128k", str(path)], check=True)
    wav.unlink()
    print(path.relative_to(ROOT))


def main() -> None:
    music = ROOT / "assets" / "music"
    save(song(112, [("C", ""), ("G", ""), ("A", "m"), ("F", "")]), music / "upbeat.mp3")
    save(song(100, [("D", ""), ("A", ""), ("B", "m"), ("G", "")], drums=0.8, pad_vol=0.16), music / "corporate.mp3")
    save(song(88, [("F", ""), ("C", ""), ("D", "m"), ("A#", "")], drums=0.55, pad_vol=0.18, bright=0.7), music / "warm.mp3")
    sfx = ROOT / "assets" / "sfx"
    for name, fn in [("whoosh", whoosh), ("pop", pop), ("ding", ding), ("hit", hit), ("click", click), ("zap", zap), ("tick", tick), ("ting", ting), ("type", type_key)]:
        save(fn(), sfx / f"{name}.mp3")


if __name__ == "__main__":
    main()
