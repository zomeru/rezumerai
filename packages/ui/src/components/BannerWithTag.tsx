import { cn } from "@rezumerai/utils/styles";

export default function BannerWithTag({
  tag,
  bannerStyle,
  textStyle,
}: {
  tag: string;
  bannerStyle?: string;
  textStyle?: string;
}) {
  return (
    <div
      className={cn(
        "w-full bg-linear-to-r from-[#ABFF7E] to-[#FDFEFF] py-2.5 text-center font-medium text-green-800 text-sm",
        bannerStyle,
      )}
    >
      <p>
        <span className={cn("mr-2 rounded-lg bg-green-600 px-3 py-1 text-white", textStyle)}>New</span>
        {tag}
      </p>
    </div>
  );
}
