import clsx from "clsx";

interface Props {
  name?: string;
  image?: string;
  className?: string;
}

export default function Avatar({ name, image, className }: Props) {
  const initials = (name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={clsx(
        "flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#043658] text-sm font-semibold text-white",
        className
      )}
    >
      {image ? (
        <img src={image} alt={name || "User avatar"} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}