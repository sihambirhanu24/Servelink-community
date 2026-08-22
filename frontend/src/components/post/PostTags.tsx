"use client";

interface Category {
  name?: string;
}

interface Community {
  name?: string;
}

interface Tag {
  name: string;
}

interface PostTagsProps {
  category?: Category;
  community?: Community;
  tags?: Tag[];
}

export function PostTags({ category, community, tags }: PostTagsProps) {
  if (!category?.name && !community?.name && (!tags || tags.length === 0)) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {category?.name && (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          category.name.toUpperCase() === 'ANNOUNCEMENT'
            ? 'bg-[#FFC107] text-[#043658] uppercase tracking-wide shadow-sm'
            : 'bg-slate-100 text-slate-700'
        }`}>
          {category.name}
        </span>
      )}
      {tags && tags.length > 0 && tags.map((tag) => (
        <span key={tag.name} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          {tag.name}
        </span>
      ))}
      {community?.name && (
        <span className="rounded-full bg-[#043658]/8 px-2.5 py-0.5 text-xs font-semibold text-[#043658]">
          {community.name}
        </span>
      )}
    </div>
  );
}
