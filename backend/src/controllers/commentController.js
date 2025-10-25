import Post from '../models/Post.js';

const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const comment = {
      author: req.user.userId,
      text,
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    const populated = await post.populate('comments.author', 'name email');
    res.status(201).json(populated.comments[populated.comments.length - 1]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });

    if (comment.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    comment.deleteOne();
    await post.save();
    res.json({ msg: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export default { addComment, deleteComment };
