import ResourceCard from "./ResourceCard";

interface Props {
  resources: any[];
}

export default function ResourceGrid({
  resources,
}: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

      {resources.map((resource) => (

        <ResourceCard
          key={resource.id}
          resource={resource}
        />

      ))}

    </div>
  );
}