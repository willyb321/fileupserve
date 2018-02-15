///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {extname, join} from 'path';
import {insertImg, checkDB} from './dbutils';
import * as basicAuth from 'express-basic-auth';
import * as multer from 'multer';
import {proxyImg} from './index';
import * as probe from 'probe-image-size';
import {readFileSync} from "fs";

function filterUploads(req, file, cb) {
	const extension = extname(file.originalname);
	extension !== '.png' ? cb(null, false) : cb(null, true);
}

const router = express.Router();

const storage = require('multer-gridfs-storage')({
	url: process.env.MONGO_URL
});

const upload = multer({dest: join(__dirname, '..', '..', 'uploads'), fileFilter: filterUploads, storage});

interface addedData {
	done: boolean;
	url: string;
	deleteURL: string;
}
interface file extends Express.Multer.File {
	properURL: string;
	thumbPath: string;
	width: number;
	id: string;
	height: number;
}
interface Request extends express.Request {
	file: file;
}
router.post('/', basicAuth({
	users: {
		uploader: (process.env.FILEUPSERVE_PW || 'test')
	},
	challenge: true
}), upload.single('imageData'), (req: Request, res: express.Response) => {
	if (req.file) {
		req.file.properURL = `/i/${req.file.id}.png`;
		req.file.thumbPath = proxyImg(req.file.properURL);
		insertImg(req.file)
			.then((data: checkDB) => {
				if (data.exists === true) {
					console.log(req.file);
					const url: string = `${req.get('X-Forwarded-Proto') || req.protocol}://${req.get('X-Forwarded-Host') || req.get('host')}/i/${req.file.id}.png`;
					const toReturn: addedData = {done: true, url: url, deleteURL: `${url}?delete=true`};
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
