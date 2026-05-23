require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json()); 

app.get('/ping', (req, res) => {
    res.json({ message: 'InventoryPilot API is live and breathing!' });
});

// We will import and use routes here later
// app.use('/api/auth', require('./src/routes/authRoutes'));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
app.use('/api/auth', require('./src/routes/authRoutes'));

app.use('/api/scanner', require('./src/routes/scannerRoutes'));

app.use('/api/inventory', require('./src/routes/inventoryRoutes'));