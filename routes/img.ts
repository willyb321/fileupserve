///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from "express";
import {getImg, checkDB, removeImg} from './dbutils'
import * as fs from 'fs-extra';
import * as basicAuth from "express-basic-auth";
import {join} from "path";
import {fileRemoved} from "./index";

const router = express.Router();

router.get('/:id', (req: express.Request, res: express.Response, next: express.NextFunction) => {
	const id: string = req.params.id;
	if (req.query.delete) {
		next();
	} else {
		getImg(id)
			.then((data: checkDB) => {
				console.log(data);
				if (!data.exists) {
					res.status(404);
					res.end();
				} else {
					res.type(data.doc.mimetype || 'image/png');
					const resOpts = {
						dotfiles: 'deny',
						maxAge: 86400000 * 7
					};
					res.sendFile(data.doc.path, resOpts);
				}
			})
			.catch(err => {
				console.log(err);
				if (!err) {
					res.status(404);
					res.end();
				} else {
					res.status(500);
					res.end();
				}
			})
	}
});

router.get('/:id', basicAuth({
	users: {
		uploader: (process.env.FILEUPSERVE_PW || 'test')
	},
	challenge: true
}), (req: express.Request, res: express.Response) => {
	const id: string = req.params.id;
	getImg(id)
		.then(async (data: checkDB) => {
			console.log(data);
			if (!data.exists) {
				res.status(404);
				res.end();
			} else {
				if (fs.existsSync(data.doc.path)) {
					removeImg(data.doc.imgId)
						.then(deleted => {
							fs.unlinkSync(data.doc.path);
							if (fs.existsSync(join(__dirname, '..', '..', 'public', 'thumbs', data.doc.filename))) {
								fs.unlinkSync(join(__dirname, '..', '..', 'public', 'thumbs', data.doc.filename));
								const path = join(__dirname, '..', '..', 'public', 'thumbs', data.doc.filename);
								fileRemoved(path);
							}
							res.status(200);
							res.json({deleted: deleted});
						}).catch(err => {
						console.log(err);
						if (err) {
							res.status(500);
							res.end();
						}
					})
				}
			}
		})
		.catch(err => {
			console.log(err);
			res.status(500);
			res.end();
		})
});

export default router;
