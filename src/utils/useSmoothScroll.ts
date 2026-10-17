import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Smooth scroll ala warungrebahan.com (Lenis, lerp 0.1).
 * Elemen yang punya scroll sendiri (modal, dropdown, tabel, chat) tetap pakai
 * scroll bawaan supaya tidak "dibajak" oleh Lenis. Untuk memaksa elemen
 * tertentu tetap native, tambahkan atribut `data-lenis-prevent`.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      lerp: 0.1,
      autoRaf: true,
      prevent: (node) => {
        if (!(node instanceof Element) || node === document.body || node === document.documentElement) {
          return false;
        }
        const oy = getComputedStyle(node).overflowY;
        return (oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1;
      },
    });

    return () => lenis.destroy();
  }, []);
}
