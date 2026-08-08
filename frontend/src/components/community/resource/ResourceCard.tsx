import { FileText } from "lucide-react";

interface Props {
  resource: any;
}

export default function ResourceCard({
  resource,
}: Props) {
  return (
    <div
      className="
      rounded-[24px]
      border
      bg-white
      p-6
      shadow-sm
      hover:shadow-lg
      transition
      "
    >

      <FileText
        size={34}
        className="text-[#043658]"
      />

      <h3 className="mt-5 text-lg font-bold">
        {resource.title}
      </h3>

      <p className="mt-3 text-sm text-gray-500">
        {resource.description}
      </p>

      <button className="mt-6 rounded-xl bg-[#043658] px-5 py-2 text-white">
        Download
      </button>

    </div>
  );
}