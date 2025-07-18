const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const SCORES_FILE = path.join(__dirname, 'scores.json');

app.use(cors());
app.use(bodyParser.json());

// Ensure scores file exists
if (!fs.existsSync(SCORES_FILE)) fs.writeFileSync(SCORES_FILE, '{}');

app.post('/api/save-score', (req, res) => {
  const { address, score } = req.body;
  if (!address || typeof score !== 'number') {
    return res.status(400).json({ message: 'Invalid data' });
  }

  const data = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
  const prev = data[address];
  if (!prev || score > prev) {
    data[address] = score;
    fs.writeFileSync(SCORES_FILE, JSON.stringify(data, null, 2));
  }

  res.json({ message: 'Score saved' });
});

app.get('/api/scores', (req, res) => {
  const data = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});