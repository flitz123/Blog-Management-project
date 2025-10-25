const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const postCtrl = require('../controllers/postController');

// Public routes
router.get('/', postCtrl.getAllPosts);
router.get('/:id', postCtrl.getPostById);

// Protected routes
router.post('/', auth, postCtrl.createPost);
router.put('/:id', auth, postCtrl.updatePost);
router.delete('/:id', auth, postCtrl.deletePost);

module.exports = router;
