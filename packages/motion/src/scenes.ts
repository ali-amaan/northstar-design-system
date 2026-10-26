import { scenes, sceneUrls } from './generated/scenes.js';
import type { MotionTheme, SceneEntry } from './types.js';

export { scenes, sceneNames, type SceneName } from './generated/scenes.js';

/** The index entry for a scene in a theme, or undefined. */
export function getScene(name: string, theme: MotionTheme = 'night'): SceneEntry | undefined {
  return scenes.find(s => s.name === name && s.theme === theme);
}

/** The URL of a scene's JSON, resolved by the bundler as a static asset. */
export function sceneUrl(name: string, theme: MotionTheme = 'night'): URL {
  const get = sceneUrls[`${theme}/${name}`];
  if (!get) throw new Error(`unknown scene ${theme}/${name}`);
  return get();
}

/** Fetches a scene's Lottie JSON. */
export async function loadScene(name: string, theme: MotionTheme = 'night'): Promise<unknown> {
  const res = await fetch(sceneUrl(name, theme));
  if (!res.ok) throw new Error(`scene ${theme}/${name}: HTTP ${res.status}`);
  return res.json();
}
