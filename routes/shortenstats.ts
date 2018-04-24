import * as rp from 'request-promise';
import * as express from 'express';
import {url} from "./dbutils";
import {ensureLoggedIn} from 'connect-ensure-login';

const router = express.Router();

router.get('/', ensureLoggedIn('/login'), (req: express.Request, res: express.Response) => {
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
			console.log(urls)
			const truncateString = (str, num) => str.length > num ? str.slice(0, num > 3 ? num - 3 : num) + '...' : str;
			urls.list.forEach(elem => elem.truncated = truncateString(elem.target, 20));
			res.render('stats', {stats: urls, domain: process.env.DOMAIN || 'http://localhost:3000'});
		})
		.catch(err => {
			console.error(err);
			res.status(500);
			res.end();
		});
});

export default router;
