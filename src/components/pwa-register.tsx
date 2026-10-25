import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  if (!installPrompt || installed) return null;
  return <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm shadow-lg" role="region" aria-label="Install PhysioSmart AI">
    <span className="min-w-0"><strong className="block">Install PhysioSmart AI</strong><span className="text-xs text-muted-foreground">Open the learning platform like an app.</span></span>
    <button type="button" className="shrink-0 rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground" onClick={async () => { const prompt = installPrompt; setInstallPrompt(null); await prompt.prompt(); await prompt.userChoice.catch(() => {}); }}>Install</button>
    <button type="button" aria-label="Dismiss install suggestion" className="shrink-0 rounded-md px-2 py-2 text-muted-foreground" onClick={() => setInstallPrompt(null)}>✕</button>
  </div>;
}
