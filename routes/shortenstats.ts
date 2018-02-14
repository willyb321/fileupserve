///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {url, UrlModel} from "./dbutils";
import * as basicAuth from 'express-basic-auth';

const router = express.Router();

router.get('/', basicAuth({
	users: {
		uploader: (process.env.FILEUPSERVE_PW || 'test')
	},
	challenge: true
}), (req: express.Request, res: express.Response) => {
	UrlModel.find({})
		.sort({click_count: -1})
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
