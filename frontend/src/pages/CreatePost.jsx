import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

export default function CreatePost() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [slug, setSlug] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    if (!id) return;
    api.get(`/posts/${id}/manage`).then(({ data }) => {
      setTitle(data.title || '');
      setContent(data.content || '');
      setTags(data.tags?.join(', ') || '');
      setCategory(data.category || '');
      setExcerpt(data.excerpt || '');
      setCoverImage(data.coverImage || '');
      setSlug(data.slug || '');
      setMetaTitle(data.metaTitle || '');
      setMetaDescription(data.metaDescription || '');
      setStatus(data.status || 'draft');
      if (data.scheduledAt) {
        const localDate = new Date(new Date(data.scheduledAt).getTime() - new Date().getTimezoneOffset() * 60_000);
        setScheduledAt(localDate.toISOString().slice(0, 16));
      }
    }).catch((err) => setError(err.response?.data?.message || 'Post could not be loaded.'));
  }, [id]);

  const uploadCoverImage = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
    const isVideo = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type);
    const isDocument = file.type === 'application/pdf';
    if ((!isImage && !isVideo && !isDocument) || file.size > 20 * 1024 * 1024) {
      setError('Choose a JPG, PNG, WebP, GIF, MP4, WebM, MOV, or PDF file up to 20 MB.');
      input.value = '';
      return;
    }

    setError('');
    setUploadingImage(true);
    try {
      const { data: signature } = await api.post('/uploads/signature');
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', signature.apiKey);
      form.append('timestamp', signature.timestamp);
      form.append('folder', signature.folder);
      form.append('signature', signature.signature);
      const resourceType = isImage ? 'image' : isVideo ? 'video' : 'raw';
      const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/${resourceType}/upload`, { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Image upload failed.');
      const markdown = isImage ? `![${file.name}](${result.secure_url})` : `[${file.name}](${result.secure_url})`;
      setContent(current => current ? `${current}\n\n${markdown}\n` : markdown);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
      input.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title || !content) {
      setError('Title and content are required.');
      return;
    }
    if (status === 'scheduled' && (!scheduledAt || new Date(scheduledAt) <= new Date())) {
      setError('Choose a future publication date.');
      return;
    }

    try {
      const payload = {
        title,
        content,
        category,
        status,
        excerpt,
        coverImage,
        slug,
        metaTitle,
        metaDescription,
        scheduledAt: status === 'scheduled' ? new Date(scheduledAt).toISOString() : null,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };
      const res = id ? await api.patch(`/posts/${id}`, payload) : await api.post('/posts', payload);
      nav(res.data.status === 'published' ? `/posts/${res.data.slug || res.data._id}` : '/my-posts');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || 'Failed to create post.');
    }
  };

  return (
    <div className="editor-page"><div className="editor-heading"><p className="eyebrow">{id ? 'Edit entry' : 'New entry'}</p><h1>{id ? 'Shape this story.' : 'Put something good into the world.'}</h1><p>Write plainly. Leave space for the reader.</p></div><form onSubmit={handleSubmit} className="editor-form">
        <input
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="field field-title"
          required
        />
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="field"
        />
        <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className="field" />
        <input type="url" placeholder="Cover image URL" value={coverImage} onChange={e => setCoverImage(e.target.value)} className="field" />
        <label>Upload media (images, video, PDF)<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf" onChange={uploadCoverImage} disabled={uploadingImage} className="field" /></label>
        {uploadingImage && <p className="status-message">Uploading media...</p>}
        <input type="text" placeholder="Short excerpt" value={excerpt} onChange={e => setExcerpt(e.target.value)} className="field" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="field" aria-label="Post status"><option value="draft">Save as draft</option><option value="published">Publish now</option><option value="scheduled">Schedule</option><option value="archived">Archive</option></select>
        {status === 'scheduled' && <label>Publish at<input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="field" required /></label>}
        <details><summary>Search engine details</summary>
          <input type="text" placeholder="URL slug" value={slug} onChange={e => setSlug(e.target.value)} className="field" />
          <input type="text" placeholder="Meta title (70 characters max)" maxLength={70} value={metaTitle} onChange={e => setMetaTitle(e.target.value)} className="field" />
          <textarea placeholder="Meta description (160 characters max)" maxLength={160} value={metaDescription} onChange={e => setMetaDescription(e.target.value)} className="field" />
        </details>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write in Markdown..."
          className="field editor-textarea"
          required
        />
        {error && <p className="form-error">{error}</p>}<button type="submit" className="button button-primary">{id ? 'Save changes' : status === 'scheduled' ? 'Schedule note' : status === 'draft' ? 'Save draft' : 'Publish note'} <span>↗</span></button>
      </form>
    </div>
  );
}
