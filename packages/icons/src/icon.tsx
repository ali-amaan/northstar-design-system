import { useId, type Ref, type SVGProps } from 'react';
import { icons, type IconName } from './generated/data.js';

export interface NamedIconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'ref' | 'children'> {
  /** Rendered width and height. The grid is 20; 16 / 20 / 24 are the system sizes. */
  size?: number | string;
  /** An accessible name. Without one the icon is decorative and hidden from assistive technology. */
  title?: string;
  ref?: Ref<SVGSVGElement>;
}

export interface IconProps extends NamedIconProps {
  name: IconName;
}

/** One instrument icon. Both line weights and fills take `currentColor`. */
export function Icon({ name, size = 20, title, ref, ...rest }: IconProps) {
  const titleId = useId();
  const data = icons[name];
  const a11y = title ? { role: 'img', 'aria-labelledby': titleId } : { 'aria-hidden': true as const };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      focusable="false"
      data-ns-icon={name}
      {...a11y}
      {...rest}
      ref={ref}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {data.paths.map((p, i) =>
        p.kind === 'fill' ? (
          <path key={i} d={p.d} fill="currentColor" />
        ) : (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={p.kind === 'hair' ? 1 : 1.5}
            strokeLinecap="butt"
            strokeLinejoin="miter"
          />
        ),
      )}
    </svg>
  );
}
