const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
	res.status(403);
	res.end('<p>nah</p>')
});

module.exports = router;
