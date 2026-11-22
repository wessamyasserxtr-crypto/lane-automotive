import { useState } from 'react';
import { Download, Smartphone, WifiOff } from 'lucide-react';
import type { LangCode } from '../data/cars';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton({ lang }: { lang: LangCode }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isAr = lang === 'ar';

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap border border-[#ed1c24]/60 bg-[#1c0d0f] px-3 text-[11px] font-semibold text-[#ffd6d8] transition-colors hover:bg-[#ed1c24] hover:text-white"
      >
        <Download className="h-3.5 w-3.5" />
        <span>{isAr ? 'تثبيت التطبيق' : 'Install App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap border border-white/25 px-3 text-[11px] font-medium text-[#e5e2dd] hover:border-[#ed1c24]"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>{isAr ? 'تثبيت على iPhone' : 'Install iOS'}</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <div className="w-full max-w-sm border border-[#333] bg-[#121214] p-6">
              <h3 className="text-base font-bold text-[#f5f3ef]">
                {isAr ? 'تثبيت تطبيق LANE على iPhone / iPad' : 'Install LANE on iPhone / iPad'}
              </h3>
              <ol className="mt-3 space-y-2 text-xs leading-relaxed text-[#ccc]">
                <li>
                  1. {isAr ? 'اضغط على زر المشاركة (Share) في شريط Safari.' : 'Tap the Share button in Safari toolbar.'}
                </li>
                <li>
                  2. {isAr ? 'اختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen).' : 'Scroll down and tap Add to Home Screen.'}
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 h-10 w-full bg-[#ed1c24] text-xs font-bold text-white"
              >
                {isAr ? 'فهمت' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export function OfflineIndicator({ lang }: { lang: LangCode }) {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-5 end-5 z-50 flex items-center gap-2 border border-[#755320] bg-[#1e1508] px-4 py-2.5 text-xs font-medium text-[#f5d39b] shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5" />
      <span>
        {lang === 'ar'
          ? 'وضع عدم الاتصال — يتم عرض البيانات المحفوظة محليًا'
          : 'Offline Mode — Showing cached showroom data'}
      </span>
    </div>
  );
}
