interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function CommunityPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">
        Community {id}
      </h1>
    </main>
  );
}