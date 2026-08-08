import { PostCard } from '@/components/community/PostCard';

// Maps YOUR real communityPost shape (title, description, teacher{...},
// attachments[], communityLikes[], etc.) onto the props your EXISTING
// PostCard component already expects (authorName, body, attachment,
// likeCount...). This is the adapter, not a redesign — PostCard itself
// is untouched, imported exactly as it already exists.
function adaptPostForCard(post: any) {
  const firstAttachment = post.attachments?.[0];
  return {
    id: post.id,
    authorName: `${post.teacher.firstName} ${post.teacher.lastName}`,
    authorRole: post.teacher.school ?? post.teacher.level,
    authorAvatarUrl: post.teacher.profileImage ?? undefined,
    timeAgo: new Date(post.createdAt).toLocaleDateString(),
    body: post.description ?? post.title,
    attachment: firstAttachment
      ? {
          name: firstAttachment.fileName,
          size: `${(firstAttachment.fileSize / (1024 * 1024)).toFixed(1)} MB`,
          fileType: firstAttachment.type === 'PDF' ? 'pdf' : firstAttachment.type === 'DOCX' ? 'doc' : 'other',
        }
      : undefined,
    likeCount: post.likesCount ?? post.communityLikes?.length ?? 0,
    commentCount: post.comments?.length ?? 0,
  };
}

export function CommunityTypeFeed({ posts }: { posts: any[] }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-500">No posts here yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={adaptPostForCard(post)} />
      ))}
    </div>
  );
}
