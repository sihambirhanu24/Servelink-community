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

export function CardHeader({ children, className = "" }: Props) {
  return (
    <div className={clsx("flex flex-col space-y-1.5 p-6", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: Props) {
  return (
    <h3 className={clsx("text-2xl font-semibold leading-none tracking-tight", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }: Props) {
  return (
    <p className={clsx("text-sm text-gray-500", className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "" }: Props) {
  return (
    <div className={clsx("p-6 pt-0", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }: Props) {
  return (
    <div className={clsx("flex items-center p-6 pt-0", className)}>
      {children}
    </div>
  );
}

// Named export for Card
export { Card };