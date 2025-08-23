const express = require('express');
const app = express();

// default route
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
