///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {getImg, checkDB, removeImg, db, dbDocModel, dbDoc} from './dbutils'
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
		dbDocModel.findOne({filename: id})
			.then((doc: dbDoc) => {
				if (doc) {
					Attachment.readById(doc.gridId, (err, buf) => {
						if (err) {
							console.error(err);
							res.status(500);
							res.end();
						} else {
							res.type('image/png');
							res.send(buf);
						}
					});
				} else {
					res.status(404);
					res.end();
				}
			})
			.catch(err => {
				console.error(err);
				res.status(500);
				res.end();
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
	dbDocModel.findOneAndRemove({filename: id})
		.then((doc: dbDoc) => {
			if (doc) {
				Attachment.unlinkById(doc.gridId, (err, unlinked) => {
					if (err) {
						res.status(500);
						res.end();
					} else {
						res.json({doc, unlinked})
					}
				})
			}
		})
		.catch(err => {
			console.error(err);
			res.status(500);
			res.end();
		});

});

export default router;
