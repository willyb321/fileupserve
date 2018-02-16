///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {getImg, checkDB, removeImg, db, dbDocModel} from './dbutils'
import * as fs from 'fs-extra';
import * as basicAuth from 'express-basic-auth';
import { join } from 'path';
import * as mongoose from "mongoose";
// const db = new Datastore({filename: require('path').join(__dirname, 'imgDb.db'), autoload: true});
db.on('error', console.error.bind(console, 'connection error:'));
let Attachment;
let gridfs;
db.once('open', () => {
	console.log('Connected!');
	gridfs = require('mongoose-gridfs')({
		mongooseConnection: mongoose.connection
	});
	Attachment = gridfs.model;
});
const router = express.Router();

router.get('/:id\.:ext?', (req: express.Request, res: express.Response, next: express.NextFunction) => {
	const id: string = req.params.id;
	if (!req.params.ext) {
		return res.redirect(`/i/${req.params.id}.png`);
	}
	if (req.query.delete) {
		next();
	} else {
		Attachment.readById(id, (err, buf) => {
			if (err) {
				console.error(err);
				res.status(500);
				res.end();
			} else {
				res.type('image/png');
				res.send(buf);
			}
		});
	}
});

router.get('/:id.:ext?', basicAuth({
	users: {
		uploader: (process.env.FILEUPSERVE_PW || 'test')
	},
	challenge: true
}), (req: express.Request, res: express.Response) => {
	const id: string = req.params.id;
	Attachment.unlinkById(id, (err, unlinked) => {
		if (err) {
			res.status(500);
			res.end();
		} else {
			dbDocModel.findOneAndRemove({filename: unlinked.filename}, (err) => {
				if (err !== null) {
					console.log(err);
					res.json({deleted: false, err});
				} else {
					res.json({deleted: true, unlinked});
				}
			});
			console.log(unlinked);
		}
	})
});

export default router;
