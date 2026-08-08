import CommunityCard from "./CommunityCard";

interface Props {
  communities: any[];
}

export default function CommunityGrid({
  communities,
}: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {communities.map((community) => (
        <CommunityCard
          key={community.id}
          id={community.id}
          name={community.name}
          description={community.description}
          members={community._count.communityMembers}
          posts={community._count.posts}
        />
      ))}
    </div>
  );
}