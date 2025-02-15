const express = require('express');
const connectDB = require('./config/db');
const app = express();

const PORT = process.env.PORT || 5000;

//Connect database
connectDB();
app.use(express.json({ extended: false }));
app.get('/', (req, res) => res.send("API running"))

//Define route
app.use('/api/users', require('./routes/api/user'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/profile', require('./routes/api/profile'));


app.listen(5000, () => { console.log(`server started on port ${PORT}`) });