export declare const ALLOWED_STROKE_WIDTHS: string[];
export declare const ALLOWED_PAINT: string[];
export interface SvgElement {
  name: string;
  attrs: Record<string, string>;
  text: string;
}
export declare function parseSvg(source: string): SvgElement[];
export declare function lintIcon(name: string, source: string, entry?: { title?: string }): string[];
export declare function lintIconSet(svgDir: string, manifestPath: string): { checked: number; problems: string[] };
