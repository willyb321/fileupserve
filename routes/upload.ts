///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {join} from 'path';
import {insertImg, checkDB} from './dbutils';
import * as basicAuth from 'express-basic-auth';
import * as multer from 'multer';

const router = express.Router();
const upload = multer({ dest: join(__dirname, '..', 'uploads') });

export interface addedData {
	done: boolean;
	url: string;
}
router.post('/', basicAuth({users: {
	uploader: process.env.FILEUPSERVE_PW
}}), upload.single('imageData'), (req, res) => {
	if (req.file) {
		const id = req.file.filename;
		insertImg(req.file)
			.then((data: checkDB) => {
				if (data.exists === true) {
					console.log(req.file);
					const url: string = `https://${req.get('X-Forwarded-Host') || req.get('host')}/i/${id}`;
					const toReturn: addedData = {done: true, url: url};
					res.json(toReturn);
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
