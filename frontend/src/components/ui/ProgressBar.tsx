interface Props {
  value: number;
}

export default function ProgressBar({ value }: Props) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className="bg-[#043658] h-3 rounded-full"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}