const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const req = require('express/lib/request');


// @route POST  api/posts
// @desc  Create a post
// @access private

router.post('/', [auth, [check('text', 'Text is required').not().isEmpty()]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const user = await User.findById(req.user.id).select('-password');
    const newPost = new Post({ text: req.body.text, name: user.name, avatar: user.avatar, user: req.user.id });
    const post = await newPost.save();
    res.json(post);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route GET  api/posts
// @desc  Get all post
// @access private

router.get('/', [auth, []], async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// @route GET  api/posts/:id
// @desc  Get post by id
// @access private

router.get('/:id', [auth, []], async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }
    res.json(post);

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: "Post not found" })
    }
    res.status(500).send('Server Error');
  }
});

// @route DELETE  api/posts/:id
// @desc  delete a post by id
// @access private

router.delete('/:id', [auth, []], async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }
    // check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" })
    }

    await post.deleteOne({ _id: req.params.id });
    res.json({ msg: 'post removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: "Post not found" })
    }
    res.status(500).send('Server Error');
  }
});

// @route PUT  api/posts/like/:id
// @desc  Like a post
// @access private

router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
      return res.status(400).json({ msg: "post already liked" });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error')
  }
});

// @route PUT  api/posts/like/:id
// @desc  UnLike a post
// @access private

router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
      return res.status(400).json({ msg: "post has not yet liked" });
    }
    // remove index
    const removeIndex = post.likes.map(like => like.user.toString().indexOf(req.user.id));
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error')
  }
});

// @route POST  api/posts/comments/:id
// @desc  add comment to a post
// @access private

router.post('/comment/:id', [auth, [check('text', 'Text is required').not().isEmpty()]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const post = await Post.findById(req.params.id);
    const user = await User.findById(req.user.id).select('-password');

    post.comments.unshift({ text: req.body.text, name: user.name, avatar: user.avatar, user: req.user.id });
    await post.save();
    res.json(post.comments);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error')
  }
});



// @route DELETE  api/posts/comments/:id
// @desc  delete a comment
// @access private

router.delete('/comment/:id/:commemt_id', auth, async (req, res) => {

  try {
    const post = await Post.findById(req.params.id);
    // pull out comments
    const comment = post.comments.find(comment => comment.id === req.params.commemt_id);
    if (!comment) {
      return res.status(404).json({ msg: "comment does not exist..!" });
    }
    // check user
    if (comment.user.id.toString() === req.user.id) {
      return res.status(401).json({ msg: "unauthorized user" });
    }
    // remove index 
    const removeIndex = post.comments.map(like => like.user.toString().indexOf(req.user.id));
    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post.comments);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error')
  }
});

module.exports = router;