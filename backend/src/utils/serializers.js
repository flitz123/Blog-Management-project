export const mapUser = (row) => {
  if (!row) return null;
  const { password_hash: _passwordHash, ...user } = row;
  return {
    ...user,
    _id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapComment = (row) => {
  if (!row) return null;
  return {
    ...row,
    _id: row.id,
    guestName: row.guest_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: row.author ? mapUser(row.author) : row.author_id,
    post: row.post ? { ...row.post, _id: row.post.id } : row.post_id,
    parent: row.parent_id,
  };
};

export const mapPost = (row, { author, comments = [], likes = [] } = {}) => {
  if (!row) return null;
  const { search_vector: _searchVector, ...post } = row;
  return {
    ...post,
    _id: row.id,
    author: author ? mapUser(author) : row.author_id,
    comments: comments.map(mapComment),
    likes: likes.map((like) => like.user_id ?? like),
    scheduledAt: row.scheduled_at,
    coverImage: row.cover_image,
    subcategory: row.subcategory,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapCategory = (row) => {
  if (!row) return null;
  return {
    ...row,
    _id: row.id,
    parent: row.parent ? { ...row.parent, _id: row.parent.id } : row.parent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapSubscription = (row) => row && ({
  ...row,
  _id: row.id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
