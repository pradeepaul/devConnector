const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');

// @route GET/api/profile/me
// @desc  Get user profile
// @access private

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" })
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error")
  }
  res.send("profile route");
});

// @route POST/api/profile
// @desc  create or update user profile
// @access private

router.post('/', [auth, [
  check('status', 'Status is required').not().isEmpty(),
  check('skills', 'skills is required').not().isEmpty(),]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const profileFields = {};
    profileFields.user = req.user.id;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githubusername) profileFields.githubusername = req.body.githubusername;
    if (req.body.skills) { profileFields.skills = req.body.skills.split(',').map(skill => skill.trim()); }

    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }
      // create
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('server error');
    }
  });


// @route GET/api/profile
// @desc  Get all profile
// @access public

router.get('/', auth, async (req, res) => {
  try {
    const profiles = await Profile.find({ user: req.user.id }).populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error")
  }
});


// @route GET/api/profile/user/:user_id
// @desc  Get profile by user id
// @access public

router.get('/user/:user_id', auth, async (req, res) => {
  try {
    const profiles = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
    if (!profiles) return res.status(400).json({ msg: 'Profile not found' });
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send("server error")
  }
});



// @route DELETE/api/profile
// @desc  Delete user, profile &  post
// @access private

router.delete('/', auth, async (req, res) => {
  try {
    // Remove profile
    await Profile.findOneAndDelete({ user: req.user.id });
    await User.findOneAndDelete({ _id: req.user.id });
    res.json({ msg: "User deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error")
  }
});


module.exports = router;