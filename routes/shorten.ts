///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {join} from 'path';
import * as shortid from 'shortid';
import * as basicAuth from 'express-basic-auth';
import {url, UrlModel} from "./dbutils";

const router = express.Router();

router.get('/', basicAuth({
	users: {
		uploader: (process.env.FILEUPSERVE_PW || 'test')
	},
	challenge: true
}), (req: express.Request, res: express.Response) => {
	console.log(req.query);
	if (!req.query.longURL) {
		res.status(400);
		res.end();
		return;
	}
	// check if url already exists in database
	UrlModel.findOne({long_url: req.query.longURL}, (err, doc: url) => {
		if (doc) {
			// URL has already been shortened
			res.json({shortURL: `${process.env.DOMAIN}/s/${doc._id}`})
		} else {
			// The long URL was not found in the long_url field in our urls
			// collection, so we need to create a new entry
			const shortDoc: url = new UrlModel({
				_id: shortid.generate(),
				long_url: req.query.longURL,
				created_at: new Date()
			});
			shortDoc.save((err: Error) => {
				if (err) {
					console.log(err);
					res.status(500);
					res.end();
				} else {
					res.json({shortURL: `${process.env.DOMAIN}/s/${shortDoc._id}`})
				}
			})
		}
	});
});

export default router;
