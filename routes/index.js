const express = require('express');
const router = express.Router();
const nanoid = require('nanoid');

/* GET home page. */
router.get('/', (req, res, next) => {
	res.render('index', { title: 'Express' });
});

module.exports = router;
