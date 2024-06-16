const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const validUrl = require('valid-url');
const shortid = require('shortid');
const path = require('path');
const QRCode = require('qrcode'); // Import QRCode library

const app = express();

// Bodyparser Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB URI
const mongoURI = 'mongodb://localhost:27017/url_shortener';

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define URL Schema
const UrlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
  urlCode: String,
  createdAt: { type: Date, default: Date.now }
});

const Url = mongoose.model('Url', UrlSchema);

// Routes
app.get('/', (req, res) => {
  res.render('index'); // Assuming you have an 'index' view template
});

app.post('/shorten', async (req, res) => {
  const { originalUrl } = req.body;
  const baseUrl = 'http://localhost:3000'; // Change this to your actual base URL

  // Check base url
  if (!validUrl.isUri(baseUrl)) {
    return res.status(401).json('Invalid base URL');
  }

  // Create url code
  const urlCode = shortid.generate();

  // Check original url
  if (validUrl.isUri(originalUrl)) {
    try {
      let url = await Url.findOne({ originalUrl });
      if (url) {
        res.render('result', { shortUrl: url.shortUrl });
      } else {
        const shortUrl = baseUrl + '/' + urlCode;
        url = new Url({
          originalUrl,
          shortUrl,
          urlCode,
        });
        await url.save();
        res.render('result', { shortUrl });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Server error');
    }
  } else {
    res.status(401).json('Invalid original URL');
  }
});

app.get('/:code', async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });
    if (url) {
      return res.redirect(url.originalUrl);
    } else {
      return res.status(404).json('No URL found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
