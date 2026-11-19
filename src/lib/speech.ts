// Narration through a device Arabic voice, used only when one exists. No bundled recordings
// ship with this release; when no Arabic voice is available the UI shows a read-aloud cue instead
// of a working-looking audio button.

export type VoiceState = 'unknown' | 'available' | 'unavailable';

let cached: SpeechSynthesisVoice | null | undefined;

export function arabicVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  if (cached) return cached;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  cached = voices.find((v) => /^ar[-_]IQ/i.test(v.lang)) || voices.find((v) => /^ar/i.test(v.lang)) || null;
  return cached;
}

export function watchVoices(cb: (s: VoiceState) => void): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    cb('unavailable');
    return () => {};
  }
  const check = () => { cached = undefined; cb(arabicVoice() ? 'available' : window.speechSynthesis.getVoices().length ? 'unavailable' : 'unknown'); };
  check();
  window.speechSynthesis.addEventListener?.('voiceschanged', check);
  const t = setTimeout(() => { if (!arabicVoice()) cb('unavailable'); }, 1500);
  return () => { clearTimeout(t); window.speechSynthesis.removeEventListener?.('voiceschanged', check); };
}

export function speak(text: string, onEnd?: () => void): boolean {
  const v = arabicVoice();
  if (!v) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = v;
  u.lang = v.lang;
  u.rate = 0.88;
  if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
