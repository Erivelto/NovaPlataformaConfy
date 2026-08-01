const CHUNK_RELOAD_KEY = 'contfy_chunk_reload';

/** Recarrega a página uma vez quando um lazy chunk não existe mais após deploy. */
export function registerChunkLoadRecovery(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason as { message?: string; name?: string } | string | undefined;
    const message = typeof reason === 'string' ? reason : String(reason?.message ?? '');
    const name = typeof reason === 'object' && reason ? String(reason.name ?? '') : '';

    const isChunkError =
      name === 'ChunkLoadError' ||
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Loading chunk') ||
      message.includes('Importing a module script failed');

    if (!isChunkError) return;

    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return;
    }

    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    event.preventDefault();
    window.location.reload();
  });
}
