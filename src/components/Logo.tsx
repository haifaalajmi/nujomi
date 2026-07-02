export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="shrink-0 rounded-[22%] overflow-hidden"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small static brand asset, no need for next/image optimization */}
      <img
        src="/logo.jpg"
        alt="Nujomi"
        width={size}
        height={size}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
