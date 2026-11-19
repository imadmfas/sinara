// Service worker registration (web/PWA only). Native builds disable the PWA plugin.
import { registerSW } from 'virtual:pwa-register';

export function registerOffline() {
  if (!('serviceWorker' in navigator) || location.protocol === 'capacitor:' ) return;
  const update = registerSW({
    onNeedRefresh() {
      // Progress lives in localStorage and survives updates; offer a calm, explicit refresh.
      const bar = document.createElement('div');
      bar.className = 'update-bar';
      bar.setAttribute('role', 'status');
      bar.innerHTML = '<span>نسخة جديدة جاهزة. تقدّمك محفوظ.</span>';
      const b = document.createElement('button');
      b.textContent = 'حدّث الآن';
      b.onclick = () => void update(true);
      bar.append(b);
      document.body.append(bar);
    },
    onOfflineReady() {
      document.documentElement.dataset.offlineReady = '1';
    }
  });
}
