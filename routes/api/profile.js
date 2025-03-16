const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const request = require('request');
const config = require('config');
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

// @route DELETE/api/profile/experience
// @desc  Add profile experience
// @access private

router.put('/experience', [auth, [
  check('title', 'Title is required').not().isEmpty(),
  check('company', 'Company is required').not().isEmpty(),
  check('fromDate', 'Fromdate is required').not().isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { title, company, location, from, to, current, description } = req.body;
  const newExp = { title, company, location, from, to, current, description };
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.experience.unshift(newExp);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});


// @route DELETE/api/profile/experience/:exp_id
// @desc  Delete experience from profile
// @access private

router.delete('/experience/:exp_id', [auth, [
  check('title', 'Title is required').not().isEmpty(),
  check('company', 'Company is required').not().isEmpty(),
  check('fromDate', 'Fromdate is required').not().isEmpty(),
]], async (req, res) => {

  try {
    const profile = await Profile.findOne({ user: req.user.id });
    //get remove index
    const removeIndex = profile.experience.map((item) => { item.id }).indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});


// @route PUT/api/profile/education
// @desc  Add profile education
// @access private

router.put('/education', [auth, [
  check('school', 'school is required').not().isEmpty(),
  check('degree', 'degree is required').not().isEmpty(),
  check('fieldofstudy', 'fieldofstudy is required').not().isEmpty(),
  check('fromDate', 'Fromdate is required').not().isEmpty(),

]], async (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { school, degree, fieldofstudy, from, to, current, description } = req.body;
  const newEdu = { school, degree, fieldofstudy, from, to, current, description };
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.education.unshift(newEdu);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});


// @route DELETE/api/profile/education/:edu_id
// @desc  Delete education from profile
// @access private

router.delete('/education/:edu_id', [auth, [
  check('school', 'school is required').not().isEmpty(),
  check('degree', 'degree is required').not().isEmpty(),
  check('fieldofstudy', 'fieldofstudy is required').not().isEmpty(),
  check('fromDate', 'Fromdate is required').not().isEmpty(),
]], async (req, res) => {

  try {
    const profile = await Profile.findOne({ user: req.user.id });
    //get remove index
    const removeIndex = profile.education.map((item) => { item.id }).indexOf(req.params.exp_id);
    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

// @route DELETE/api/profile/github/:username
// @desc  get user repo from github
// @access public

router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSeret')}}`,
      method: 'GET', headers: { 'user-agent': 'node.js' }
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);
      if (response.statusCode !== 200) {
        res.status(404).Json({ msg: "No github profile found" });
      };
      res.json(JSON.parse(body));
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

module.exports = router;