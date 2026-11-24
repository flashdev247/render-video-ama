#!/usr/bin/env python3
"""Đọc lời thoại từng cảnh thành MP3 + mốc thời gian từng từ (cho phụ đề karaoke).

python3 scripts/tts.py --input tts-input.json --out-dir work/

tts-input.json: {"voice": "vi-VN-HoaiMyNeural", "rate": "+8%", "scenes": ["lời cảnh 1", ...], "voices": [null, "vi-VN-NamMinhNeural", ...]}
("voices" không bắt buộc: giọng riêng từng cảnh, vd tiểu phẩm 2 người; null = dùng "voice")
Kết quả: work/voice-{i}.mp3 và work/tts.json:
  {"scenes": [{"file": "voice-0.mp3", "words": [{"t": 0.1, "d": 0.25, "w": "Ba"}, ...]}]}

Đổi nhà cung cấp giọng đọc (vd Google Cloud TTS) thì chỉ cần thay hàm synthesize().
"""
import argparse
import asyncio
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import edge_tts

RETRIES = 5
MAX_PAUSE = 0.25  # khoảng nghỉ giữa câu tối đa (giây); edge-tts nghỉ ~1 giây sau dấu chấm làm video chậm


async def synthesize(text: str, voice: str, rate: str, mp3_path: Path) -> list[dict]:
    communicate = edge_tts.Communicate(
        text,
        voice,
        rate=rate,
        boundary="WordBoundary",
        proxy=os.environ.get("HTTPS_PROXY") or None,
    )
    words: list[dict] = []
    with mp3_path.open("wb") as audio:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({
                    "t": round(chunk["offset"] / 10_000_000, 3),
                    "d": round(chunk["duration"] / 10_000_000, 3),
                    "w": chunk["text"],
                })
    if mp3_path.stat().st_size == 0:
        raise RuntimeError("edge-tts trả về audio rỗng")
    return words


def tighten(mp3_path: Path, words: list[dict]) -> list[dict]:
    """Cắt khoảng lặng giữa câu dài hơn MAX_PAUSE và dời mốc thời gian các từ cho khớp."""
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(mp3_path), "-af", "silencedetect=n=-38dB:d=0.35", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", probe)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", probe)]
    # Chỉ cắt khoảng lặng nằm giữa hai từ (giữ nguyên đầu và cuối file)
    first = words[0]["t"] if words else 0
    last = words[-1]["t"] + words[-1]["d"] if words else 0
    cuts = [(s + MAX_PAUSE / 2, e - MAX_PAUSE / 2) for s, e in zip(starts, ends) if s > first and e < last and e - s > MAX_PAUSE]
    if not cuts:
        return words
    keep, prev = [], 0.0
    for a, b in cuts:
        keep.append((prev, a))
        prev = b
    keep.append((prev, None))
    parts = "".join(
        f"[0:a]atrim=start={a}" + (f":end={b}" if b is not None else "") + f",asetpts=PTS-STARTPTS[p{i}];" for i, (a, b) in enumerate(keep)
    )
    concat = "".join(f"[p{i}]" for i in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1[out]"
    tmp = mp3_path.with_suffix(".tight.mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3_path), "-filter_complex", parts + concat, "-map", "[out]", str(tmp)], check=True)
    tmp.replace(mp3_path)

    def shift(t: float) -> float:
        return t - sum(min(b, t) - a for a, b in cuts if a < t)

    return [{**w, "t": round(shift(w["t"]), 3)} for w in words]


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out-dir", required=True)
    args = parser.parse_args()

    data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    results = []
    for i, text in enumerate(data["scenes"]):
        mp3_path = out_dir / f"voice-{i}.mp3"
        for attempt in range(1, RETRIES + 1):
            try:
                voice = (data.get("voices") or [None] * len(data["scenes"]))[i] or data["voice"]
                words = await synthesize(text, voice, data.get("rate", "+0%"), mp3_path)
                break
            except Exception as exc:  # mạng chập chờn: thử lại
                print(f"TTS cảnh {i + 1} lỗi lần {attempt}: {exc}", file=sys.stderr)
                if attempt == RETRIES:
                    raise
                await asyncio.sleep(2 * attempt)
        results.append({"file": mp3_path.name, "words": tighten(mp3_path, words)})

    (out_dir / "tts.json").write_text(json.dumps({"scenes": results}, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
