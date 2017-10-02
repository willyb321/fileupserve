const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({dest: require('path').join(__dirname, '..', 'uploads')});
const {insertImg} = require('./dbutils');
router.post('/', upload.single('imageData'), (req, res, next) => {
	let id = req.file.filename;
	insertImg(id, req.file.filename, req.file.path)
		.then(data => {
			if (data.inserted === true) {
				const url = `https://${req.get('X-Forwarded-Host') || req.get('host')}/i/${id}`;
				res.json({done: true, url});
			}
		})
		.catch(err => {
			console.log(err);
		})
});

module.exports = router;
