const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const commentCtrl = require('../controllers/commentController');

router.post('/:postId/comments', auth, commentCtrl.addComment);
router.delete('/:postId/comments/:commentId', auth, commentCtrl.deleteComment);

module.exports = router;
