import * as express from 'express';
import * as shortid from 'shortid';
import * as basicAuth from 'express-basic-auth';
import * as rp from 'request-promise';
import {url} from './dbutils';

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
	const options: rp.Options = {
		uri: 'https://kutt.it/api/url/geturls',
		headers: {
			'User-Agent': 'Request-Promise',
			'X-API-Key': process.env.KUTT_KEY
		},
		json: true // Automatically parses the JSON string in the response
	};

	rp(options)
		.then(urls => {
			const current = urls.list.find(elem => elem.target === req.query.longURL);
			if (current) {
				console.log(`Found URL ${req.query.longURL}`);
				console.log(current);
				return res.json({shortURL: `${current.shortUrl}`});
			}
			options.uri = 'https://kutt.it/api/url/submit';
			options.method = 'POST';
			options.body = {target: req.query.longURL};
			return rp(options)
				.then(data => {
					return res.json({shortURL: `${data.shortUrl}`});
				})
				.catch(err => {
					console.error(err);
					res.status(500);
					res.end();
				})
		})
		.catch(err => {
			console.error(err);
			res.status(500);
			res.end();
		});
});

export default router;
