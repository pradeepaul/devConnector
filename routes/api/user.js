const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const config = require('config');
const jwt = require('jsonwebtoken');

router.post('/', [
  check('name', "name is required").not().isEmpty(),
  check('email', "please enter a valid email").isEmail(),
  check('password', "please enter password min of 6 or more chars").isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    // see if user exists
    if (user) { return res.status(400).json([{ "msg": "user already exists" }]) };

    // get user gravatars
    const avatar = gravatar.url(email, {
      s: '200', r: 'pg', d: 'mm'
    });

    user = new User({ name, email, avatar, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      }
    }

    jwt.sign(
      payload,
      config.get('jwtSecret'),
      { expiresIn: 360000 },
      (err, token) => { if (err) throw err; res.json({ token }) });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

module.exports = router;