///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from "express";
import {getImg} from './dbutils'

const router = express.Router();

router.get('/:id', (req, res) => {
	const id: string = req.params.id;
	getImg(id)
		.then(doc => {
			console.log(doc);
			if  (!doc.exists) {
				res.status(404);
				res.end();
			} else {
				res.type(doc.doc.mimetype || 'image/png');
				res.status(200);
				res.sendFile(doc.doc.path);
			}
		})
		.catch(err => {
			console.log(err);
		})
});

export default router;
