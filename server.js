const express = require('express');
const app = express();

const PORT = process.env.PORT || 5000;

app.listen(5000, () => { console.log(`server started on port ${PORT}`) });