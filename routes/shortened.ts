///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {url, UrlModel} from "./dbutils";

const router = express.Router();

router.get('/:shortened', (req: express.Request, res: express.Response) => {
	if (!req.params.shortened) {
		res.status(404);
		res.end();
	} else {
		UrlModel.findOne({_id: req.params.shortened}, function (err: Error, doc: url) {
			if (err) {
				res.status(500);
				res.end();
			}
			if (doc) {
				// found an entry in the DB, redirect the user to their destination
				res.redirect(doc.long_url);
			} else {
				// nothing found, take 'em home
				res.status(404);
				res.end();
			}
		});
	}
});

export default router;
