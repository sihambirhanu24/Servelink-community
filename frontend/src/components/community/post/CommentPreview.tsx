interface CommentPreviewProps {
  comment?: {
    name?: string;
    comment?: string;
  };
}

export default function CommentPreview({ comment }: CommentPreviewProps) {
  const name = comment?.name?.trim() || "Sarah Johnson";
  const content = comment?.comment?.trim() || "Thank you for sharing this resource.";

  return (
    <div className="border-t bg-[#FAFBFC] p-6">

      <h4 className="mb-5 font-semibold">

        Recent Comment

      </h4>

      <div className="flex gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#043658] text-white">

          S

        </div>

        <div>

          <h5 className="font-semibold">

            {name}

          </h5>

          <p className="mt-2 text-gray-600">

            {content}

          </p>

        </div>

      </div>

    </div>
  );
}