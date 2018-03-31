///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {url, UrlModel} from "./dbutils";
import {ensureLoggedIn} from 'connect-ensure-login';

const router = express.Router();

router.get('/', ensureLoggedIn('/login'), (req: express.Request, res: express.Response) => {
	UrlModel.find({})
		.sort({click_count: -1})
		.limit(50)
		.then((doc: url[]) => {
			if (doc) {
				// found an entry in the DB, redirect the user to their destination
				res.render('stats', {stats: doc, domain: process.env.DOMAIN || 'http://localhost:3000'});
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
});

export default router;
