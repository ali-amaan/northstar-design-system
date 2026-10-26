export type MotionTheme = 'night' | 'day';

export interface SceneEntry {
  /** `<theme>/<name>` */
  id: string;
  name: string;
  theme: MotionTheme | string;
  family: string;
  /** Path under `scenes/`. */
  file: string;
  /** Authored as a seamless loop. */
  loop: boolean;
  width: number;
  height: number;
  fps: number;
  frames: number;
  bytes: number;
  slots: readonly string[];
  /** What the scene shows; print it next to the scene. */
  caption: string;
  /** Notes an artboard must print beside the scene (world family). */
  mustPrint?: Readonly<Record<string, string>>;
}

/** Slot id -> colour as `#RRGGBB` or a 0..1 RGBA array. */
export type SlotColors = Readonly<Record<string, string | readonly number[]>>;
