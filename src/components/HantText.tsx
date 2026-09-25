import { useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { toHantText } from '../data/hantChars.generated';

/**
 * When the language is Traditional Chinese, convert the app's own inline Simplified labels in place.
 *
 * Articles and project descriptions get real Traditional copies at build time; the few hundred small
 * labels written into the components ("房", "卫浴", "步骤 1 / 4") do not, so this walks the text
 * nodes once after each render and swaps the characters that differ. Inputs are left alone.
 */
export default function HantText() {
  const { language } = useLanguage();
  useEffect(() => {
    if (language !== 'zh-TW' || typeof document === 'undefined') return;
    const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE']);
    const fix = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: n => n.parentElement && SKIP.has(n.parentElement.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
      });
      const nodes: Text[] = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
      for (const t of nodes) { const v = toHantText(t.data); if (v !== t.data) t.data = v; }
      if (root === document.body) document.title = toHantText(document.title);
    };
    fix(document.body);
    let scheduled = false;
    const obs = new MutationObserver(records => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; obs.disconnect(); fix(document.body); observe(); });
    });
    const observe = () => obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    observe();
    return () => obs.disconnect();
  }, [language]);
  return null;
}
