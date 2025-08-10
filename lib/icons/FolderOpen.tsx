import { Path, Svg } from "react-native-svg";

export function FolderOpen({ className }: { className?: string }) {
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
      <Path d="M2 9l3-3h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <Path d="M2 9V5a2 2 0 012-2h6l2 2h8a2 2 0 012 2v2" />
    </Svg>
  );
}
