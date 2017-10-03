///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from "express";
import {join} from "path";
import {insertImg, checkDB} from "./dbutils";

import * as multer from "multer";

const router = express.Router();
const upload = multer({dest: join(__dirname, '..', 'uploads')});

const token = process.env.FILEUPSERVE_TOKEN;
router.post('/', upload.single('imageData'), (req, res) => {
	const id = req.file.filename;
	const reqToken = req.header('token');
	if (reqToken === token) {
		insertImg(req.file)
			.then((data: checkDB) => {
				if (data.exists === true) {
					console.log(req.file);
					const url = `https://${req.get('X-Forwarded-Host') || req.get('host')}/i/${id}`;
					res.json({done: true, url});
				}
			})
			.catch(err => {
				console.log(err);
			})
	} else {
		res.status(403);
		res.end();
	}
});

export default router;
