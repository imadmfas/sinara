// Recorded Arabic narration clips. No recordings ship in this release.
// To add one: put the file in public/audio/ (e.g. public/audio/welcome.mp3) and map the exact text to it:
//   export const clips: Record<string, string> = { 'هلا بيك بسِينارة! آني فَطين… شنو تحب نسأل اليوم؟': 'audio/welcome.mp3' };
// A mapped clip is preferred over the device voice and works even when no Arabic voice is installed.
export const clips: Record<string, string> = {};
