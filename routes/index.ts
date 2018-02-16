///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {join, parse} from 'path';
import * as klawSync from 'klaw-sync';
import * as sharp from 'sharp';
import * as basicAuth from "express-basic-auth";
import * as fs from 'fs-extra';
import * as paginate from 'paginate-array';
import * as _ from 'lodash';
import {getAllImgs, dbDocModel, dbDoc} from "./dbutils";
import * as mongoose from "mongoose";
import * as crypto from 'crypto';
import * as probe from 'probe-image-size';
import {existsSync, readFileSync} from "fs";
import * as passport from "passport";
import {ensureLoggedIn} from "connect-ensure-login";

const router: express.Router = express.Router();
let thumbs = [];
const filesPath: string = join(__dirname, '..', 'uploads');
const KEY = process.env.IMGPROXY_KEY;
const SALT = process.env.IMGPROXY_SALT;

getThumbsForGallery()
	.then(() => {
		console.log('main page ready');

		router.get('/', ensureLoggedIn('/login'), (req: express.Request, res: express.Response) => {
			const page: number = parseInt(req.query.p, 10) || 1;
			getThumbsForGallery(page)
				.then((thumbs: thumbReturn) => {
					let captions = [];
					for (const i of thumbs.pagination.data) {
						if (i) {
							const urlcap = `${req.get('X-Forwarded-Proto') || req.protocol}://${req.get('X-Forwarded-Host') || req.get('host')}${i.properURL}`;
							captions.push(urlcap)
						}
					}
					res.render('index', {
						thumbs: thumbs.thumbs.data,
						captions,
						pagination: thumbs.pagination,
						title: 'Images and stuff'
					})
				})
		});

	});

export interface thumbObj extends mongoose.Document {
	path: string;
	properURL: string;
	filePath: string;
	width: number;
	height: number;
}

interface fileObj extends klawSync.Item {
	thumbed?: boolean;
	properURL?: string;
	filePath?: string;
	width?: number;
	height?: number;
}

export function proxyImg(url) {
	return url;
}

function getThumbsForGallery(page?: number) {
	return new Promise(async resolve => {
		let filesOrig;
		if (!page || page < 1) {
			page = 1;
		}
		const limit = 5;
		const skip = (page - 1) * limit;
		const data: any = await getAllImgs(limit, skip);
		for (const i in data) {
			if (data.hasOwnProperty(i)) {
				if (!existsSync(data[i].path)) {
					data[i].path = join(filesPath, data[i].imgId);
				}
				if (!data[i].properURL) {
					data[i].properURL = `/i/${parse(data[i].path).base}`;
				}
				if (!data[i].thumbPath) {
					data[i].thumbPath = proxyImg(data[i].properURL);
				}
				const updated = new dbDocModel(data[i]);
				dbDocModel.findOneAndUpdate({imgId: data[i].imgId}, updated)
					.catch(err => {
						if (err) {
							console.log(err);
						}
					})
			}
		}
		let count = 1;
		dbDocModel.count({}, (err, numDocs) => {
			if (err) {
				console.error(err);
			}
			count = numDocs;
			const paginated = {
				data,
				currentPage: page,
				perPage: limit,
				total: count,
				totaPages: Math.round(count / limit)
			};
			filesOrig = paginated;
			const tores: thumbReturn = {thumbs: filesOrig, pagination: filesOrig};
			resolve(tores);
		});
	})
}

export interface thumbReturn {
	thumbs: {
		data: Array<thumbObj | fileObj>;
	}
	pagination: any;
}

export function sharpie(info: fileObj) {
	info.filePath = info.path;
	info.properURL = `/i/${parse(info.filePath).base}`;
	info.path = proxyImg(info.properURL);
	return info;
}
const opts = {
	clientID: process.env.AUTH0_CLIENTID,
	domain: process.env.AUTH0_DOMAIN,
	redirectUri: process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback',
	audience: 'https://' + process.env.AUTH0_DOMAIN + '/userinfo',
	responseType: 'code',
	scope: 'openid profile'
};
router.get(
	'/login',
	passport.authenticate('auth0', opts),
	function(req, res) {
		res.redirect('/');
	}
);

// Perform session logout and redirect to homepage
router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

// Perform the final stage of authentication and redirect to '/user'
router.get(
	'/callback',
	passport.authenticate('auth0', {
		failureRedirect: '/'
	}),
	(req: any, res) => {
		res.redirect(req.session.returnTo || '/');
	}
);

export default router;
