export default function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`rounded-full bg-[#FFC107]/20 px-3 py-1 text-xs font-semibold text-[#043658] ${className}`}>
      {children}
    </span>
  );
}