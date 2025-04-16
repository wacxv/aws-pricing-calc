require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Change the path to match what the frontend expects
app.use('/api/calculations', require('./routes/calculation.routes'));
app.use('/api/regions', require('./routes/region.routes'));
app.use('/api/countries', require('./routes/country.routes'));
app.use('/api/services', require('./routes/service.routes'));
app.use('/api/call-types', require('./routes/call-type.routes'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
