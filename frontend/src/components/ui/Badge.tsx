export default function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full bg-[#FFC107]/20 px-3 py-1 text-xs font-semibold text-[#043658]">
      {children}
    </span>
  );
}