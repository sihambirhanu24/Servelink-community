import { ReactNode } from "react";
import clsx from "clsx";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className,
}: Props) {
  return (
    <div
      className={clsx(
        "rounded-3xl bg-white border border-gray-100 shadow-sm p-6 transition-all duration-300 hover:shadow-xl",
        className
      )}
    >
      {children}
    </div>
  );
}