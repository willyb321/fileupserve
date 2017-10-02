const express = require('express');
const router = express.Router();
const {getImg} = require('./dbutils');
router.get('/:id', (req, res) => {
	const id = req.params.id;
	getImg(id)
		.then(doc => {
			console.log(doc);
			if  (!doc.exists) {
				res.status(404);
				res.end();
			} else {
				res.type(doc.mimetype || 'image/png');
				res.status(200);
				res.sendFile(doc.path);
			}
		})
		.catch(err => {
			console.log(err);
		})
});

module.exports = router;
