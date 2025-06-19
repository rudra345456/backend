const express = require('express');
const app = express();
app.use(express.json());
app.get('/', (req, res) => res.send('Hello from src/server.js!'));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Src server running on port ${PORT}`)); 