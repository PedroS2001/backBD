const express = require('express')
const db = require('../models/db');

router = express.Router();

router.get('/', (req, res) => {
    res.send('Api UP')
});


module.exports = router;