const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({dest: require('path').join(__dirname, '..', 'uploads')});
const {insertImg} = require('./dbutils');
const token = process.env.FILEUPSERVE_TOKEN;
router.post('/', upload.single('imageData'), (req, res, next) => {
	let id = req.file.filename;
	const isAuthorised = (req.body.token === token);
	if (isAuthorised) {
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
	} else {
		res.status(403);
		res.end();
	}
});

module.exports = router;
