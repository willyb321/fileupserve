///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {join} from 'path';
import {insertImg, checkDB} from './dbutils';
import * as basicAuth from 'express-basic-auth';
import * as multer from 'multer';
import {newUpload} from './index';

const router = express.Router();
const upload = multer({dest: join(__dirname, '..', 'uploads')});

interface addedData {
	done: boolean;
	url: string;
	deleteURL: string;
}

router.post('/', basicAuth({
	users: {
		uploader: process.env.FILEUPSERVE_PW,
	},
	challenge: true
}), upload.single('imageData'), (req: express.Request, res: express.Response) => {
	if (req.file) {
		insertImg(req.file)
			.then((data: checkDB) => {
				if (data.exists === true) {
					console.log(req.file);
					const url: string = `${req.get('X-Forwarded-Proto') || req.protocol}://${req.get('X-Forwarded-Host') || req.get('host')}/i/${req.file.filename}`;
					const toReturn: addedData = {done: true, url: url, deleteURL: `${url}?delete=true`};
					newUpload(req.file.path)
						.then(() => res.json(toReturn));
				}
			})
			.catch(err => {
				console.log(err);
			})
	} else {
		res.status(400);
		res.end();
	}
});

export default router;
