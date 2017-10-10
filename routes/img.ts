///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from "express";
import {getImg, checkDB} from './dbutils'

const router = express.Router();

router.get('/:id', (req: express.Request, res: express.Response) => {
	const id: string = req.params.id;
	getImg(id)
		.then((data: checkDB) => {
			console.log(data);
			if  (!data.exists) {
				res.status(404);
				res.end();
			} else {
				res.type(data.doc.mimetype || 'image/png');
				const resOpts = {
					dotfiles: 'deny',
					maxAge: 86400000*7
				};
				res.sendFile(data.doc.path, resOpts);
			}
		})
		.catch(err => {
			console.log(err);
			res.status(500);
			res.end();
		})
});

export default router;
