import React from "react";
import Svg, { Path } from "react-native-svg";
import { palette } from "../theme/tokens";

/** Geometric Stayverse "S" mark from brand logo.svg (paths only). */
export type StayverseMarkProps = {
  size?: number;
  color?: string;
};

export function StayverseMark({
  size = 48,
  color = palette.primary,
}: StayverseMarkProps) {
  const height = (size * 34) / 20;
  return (
    <Svg width={size} height={height} viewBox="0 0 20 34" fill="none">
      <Path
        d="M0.953125 15.5624L8.29548 19.8364L8.27819 11.3175L12.5467 8.82422L19.8618 13.07L19.8663 4.56203L12.5422 0.307129L0.954944 7.02343L0.953125 15.5624Z"
        fill={color}
      />
      <Path
        d="M19.8663 18.1485L12.524 13.8735L12.5413 22.3924L8.27273 24.8857L0.958584 20.6399L0.953125 29.1479L8.27819 33.4028L19.8645 26.6865L19.8663 18.1485Z"
        fill={color}
      />
    </Svg>
  );
}
