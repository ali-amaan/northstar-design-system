import type { LottiePlayer } from 'lottie-web';

/** Loads lottie-web on demand: it touches `document` when imported, so it never loads during SSR. */
export async function loadLottie(): Promise<LottiePlayer> {
  return (await import('lottie-web')).default;
}
