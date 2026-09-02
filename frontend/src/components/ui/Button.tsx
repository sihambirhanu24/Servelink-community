import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function Button({
  children,
  variant = "primary",
  className,
  disabled,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        "rounded-xl px-5 py-3 font-semibold transition duration-300",

        variant === "primary" &&
          "bg-[#043658] text-white hover:bg-[#032A44]",

        variant === "secondary" &&
          "bg-[#FFC107] text-[#043658] hover:bg-yellow-400",

        disabled && "opacity-50 cursor-not-allowed hover:opacity-50",

        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}