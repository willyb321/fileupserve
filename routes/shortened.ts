///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {url, UrlModel} from "./dbutils";

const router = express.Router();

router.get('/:shortened', (req: express.Request, res: express.Response) => {
	if (!req.params.shortened) {
		res.status(404);
		res.end();
	} else if (req.query.stats) {
		UrlModel.findOne({_id: req.params.shortened})
			.then((doc: url) => {
				if (doc) {
					// found an entry in the DB, redirect the user to their destination
					res.json(doc);
				} else {
					// nothing found, take 'em home
					res.status(404);
					res.end();
				}
			}).catch(err => {
			console.error(err);
			res.status(500);
			res.end();
		});
	} else {
		UrlModel.findOneAndUpdate({_id: req.params.shortened}, {$inc: {click_count: 1}}, {new: true, upsert: false})
			.then((doc: url) => {
			if (doc) {
				// found an entry in the DB, redirect the user to their destination
				res.redirect(doc.long_url);
			} else {
				// nothing found, take 'em home
				res.status(404);
				res.end();
			}
		}).catch(err => {
			console.error(err);
			res.status(500);
			res.end();
		});
	}
});

export default router;
