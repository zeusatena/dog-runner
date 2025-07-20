const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Your MongoDB Atlas connection string
const MONGO_URI = 'mongodb+srv://dogrunner:dogrunner123@dogrunner.mrn3ipf.mongodb.net/dogrunner?retryWrites=true&w=majority&appName=dogrunner';

// Connect to MongoDB Atlas
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch(err => {
    console.error('❌ Error connecting to MongoDB:', err);
  });

app.use(cors());
app.use(bodyParser.json());

// Schema and model for scores
const scoreSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  score: { type: Number, required: true }
});

const Score = mongoose.model('Score', scoreSchema);

// Endpoint to save a score
app.post('/api/save-score', async (req, res) => {
  const { address, score } = req.body;
  if (!address || typeof score !== 'number') {
    return res.status(400).json({ message: 'Invalid data' });
  }

  try {
    const existing = await Score.findOne({ address });

    if (!existing || score > existing.score) {
      const updatedScore = await Score.findOneAndUpdate(
        { address },
        { score },
        { upsert: true, new: true }
      );
      res.json({ message: 'Score saved', data: updatedScore });
    } else {
      res.json({ message: 'Score not updated (already higher)' });
    }
  } catch (err) {
    console.error('❌ Error saving score:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to get world record and personal record
app.get('/api/get-records', async (req, res) => {
  try {
    const worldRecordDoc = await Score.findOne().sort({ score: -1 });
    const worldRecord = worldRecordDoc ? worldRecordDoc.score : 0;
    console.log('world record:', worldRecord);

    const { address } = req.query;
    const personalRecordDoc = await Score.findOne({ address });
    const personalRecord = personalRecordDoc ? personalRecordDoc.score : 0;

    res.json({ worldRecord, personalRecord });
  } catch (err) {
    console.error('❌ Error fetching records:', err);
    res.status(500).json({ message: 'Error fetching records' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
