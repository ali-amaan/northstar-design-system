/** One illustration as layered path data. Every layer maps to one --ns-* colour role. */
export interface IllustrationLayers {
  faint?: string;
  knock?: string;
  grid?: string;
  washM?: string;
  wash?: string;
  hair?: string;
  dash?: string;
  inkHair?: string;
  ink1?: string;
  ink15?: string;
  dim?: string;
  ink?: string;
  acc15?: string;
  acc?: string;
  labels?: readonly { x: number; y: number; t: string; a: string }[];
  /** Orbiting rings: path, seconds per turn, direction. Still under reduced motion. */
  rings?: readonly { d: string; s: number; dir: number }[];
}
