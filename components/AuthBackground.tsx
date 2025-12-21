import Image from "next/image";
import FLGlobalIcon from "@/components/assets/fl-global-icon";

export default function AuthBackground() {
  return (
    <>
      <Image src="/background-image.webp" alt="Background" fill className="object-cover" priority />
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="absolute top-20 lg:top-15 left-0 right-0 flex justify-center pt-6 z-20">
        <FLGlobalIcon className="h-14 w-auto" fill="currentColor" />
      </div>
    </>
  );
}
