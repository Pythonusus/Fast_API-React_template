/**
 * Draft posted by the admin preview button on the post detail route.
 *
 * The key prefix matches ``backend/app/admin/static/posts/preview.js``.
 * ``localStorage`` is shared across tabs on this origin; ``sessionStorage``
 * is not copied into a tab opened with ``noopener``.
 */
import { type Post, postSchema } from "~/types/posts";

export const POST_PREVIEW_STORAGE_PREFIX = "app-post-preview:";

export const loadPostPreview = (draftId: string | null): Post | null => {
  if (!draftId || !/^\d+$/.test(draftId)) {
    return null;
  }

  const raw = localStorage.getItem(POST_PREVIEW_STORAGE_PREFIX + draftId);
  if (!raw) {
    return null;
  }

  try {
    const parsed = postSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};
