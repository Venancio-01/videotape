import { Svg, Path } from "react-native-svg";

export function Video({ className }: { className?: string }) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <Path d="M23 7l-7 5 7 5V7z" />
      <Path d="M14 19H4a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
    </Svg>
  );
}