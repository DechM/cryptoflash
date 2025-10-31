import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  withText?: boolean;
  imgSize?: number;
};

export default function Logo({ className, withText = true, imgSize = 28 }: Props) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/branding/crypto-flash-x-profile-picture.png"
        alt="CryptoFlash"
        width={imgSize}
        height={imgSize}
        className="rounded"
        priority
      />
      {withText && <span className="font-semibold">CryptoFlash</span>}
    </Link>
  );
}
