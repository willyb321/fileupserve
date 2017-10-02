const express = require('express');
const router = express.Router();
const nanoid = require('nanoid');
const Datastore = require('nedb-core');
const multer = require('multer');
const upload = multer({dest: require('path').join(__dirname, '..', 'uploads')});
const {getImg} = require('./dbutils');
router.get('/:id', (req, res, next) => {
	const id = req.params.id;
	res.type('image/png');
	getImg(id)
		.then(doc => {
			console.log(doc);
			if  (!doc.exists) {
				res.status(404);
				res.end();
			} else {
				res.sendFile(doc.path);
			}
		})
		.catch(err => {
			console.log(err);
		})
});

module.exports = router;
