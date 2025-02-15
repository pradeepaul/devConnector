const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

router.post('/', [
  check('name', "name is required").not().isEmpty(),
  check('email', "please enter a valid email").isEmail(),
  check('password', "please enter password min of 6 or more chars").isLength({ min: 6 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  res.send("user route");
});

module.exports = router;