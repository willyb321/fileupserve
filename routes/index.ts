///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {join, parse} from 'path';
import * as klawSync from 'klaw-sync';
import * as sharp from 'sharp';
import * as basicAuth from "express-basic-auth";
import * as fs from 'fs-extra';
import * as paginate from 'paginate-array';
import * as _ from 'lodash';
import {dbDoc, getAllImgs, insertThumb, dbDocModel, db} from "./dbutils";
import * as mongoose from "mongoose";
import * as crypto from 'crypto';

const router: express.Router = express.Router();
let thumbs = [];
let alreadyThumbed: boolean = false;
const thumbsPath: string = join(__dirname, '..', '..', 'public', 'thumbs');
const filesPath: string = join(__dirname, '..', 'uploads');
const KEY = process.env.IMGPROXY_KEY;
const SALT = process.env.IMGPROXY_SALT;

getThumbsForGallery()
	.then(() => {
		console.log('main page ready');

		router.get('/', basicAuth({
			challenge: true,
			users: {
				uploader: (process.env.FILEUPSERVE_PW || 'test')
			}
		}), (req: express.Request, res: express.Response) => {
			const page: number = parseInt(req.query.page, 10) || 1;
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

export function fileRemoved(path: string) {
	const index = thumbs.findIndex(elem => (elem && elem.filePath === path));
	thumbs.splice(index, 1)
}

export async function newUpload(filename: string) {
	console.log(`filename provided: ${filename}`);
	const fileStats = await fs.stat(filename);
	const updated = await sharpie({path: filename, stats: fileStats});

	thumbs.push(updated);
	alreadyThumbed = true;
}

export interface thumbObj extends sharp.OutputInfo, mongoose.Document {
	path: string;
	properURL: string;
	filePath: string;
}

interface fileObj extends klawSync.Item {
	thumbed?: boolean;
	properURL?: string;
	filePath?: string;
}

interface klawOpts extends klawSync.Options {
	filter: any;
}

function hasAThumb(filename: fileObj, thumbsOrig: ReadonlyArray<fileObj>) {
	for (const i of thumbsOrig) {
		if (filename && i && i.path === filename.path) {
			return true;
		}
	}
	return false;
}

export function proxyImg(url) {
	const urlSafeBase64 = (string) => {
		return new Buffer(string).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
	};
	const hexDecode = (hex) => Buffer.from(hex, 'hex');
	url = `${process.env.DOMAIN || 'http://localhost:3000'}${url}`;
	const sign = (salt, target, secret) => {
		const hmac = crypto.createHmac('sha256', hexDecode(secret));
		hmac.update(hexDecode(salt));
		hmac.update(target);
		return urlSafeBase64(hmac.digest())
	};
	const resizing_type = 'fill';
	const width = 320;
	const height = 240;
	const gravity = 'no';
	const enlarge = 1;
	const extension = 'png';
	const encoded_url = urlSafeBase64(url);
	const path = `/${resizing_type}/${width}/${height}/${gravity}/${enlarge}/${encoded_url}.${extension}`;

	const signature = sign(SALT, path, KEY);
	// console.log(`${process.env.IMGPROXY_URL || '/'}${signature}${path}`);
	return `${process.env.IMGPROXY_URL || '/'}${signature}${path}`;
}

function getThumbsForGallery(page?: number) {
	return new Promise(async resolve => {
		let allFiles: ReadonlyArray<fileObj> = klawSync(filesPath, {nodir: true});
		let allFilesSorted = _.cloneDeep(allFiles).sort((a, b) => a.stats.mtime.getUTCMilliseconds() < b.stats.mtime.getUTCMilliseconds());
		const date = new Date();
		allFiles = allFilesSorted;
		const refTime = new Date().setDate(date.getDate() - 3);
		let filesOrig = paginate(allFiles, page || 1, 10);
		// thumbs = thumbs.slice(9, thumbs.length - 1);
		alreadyThumbed = false;
		if (!alreadyThumbed) {
			for (const file of filesOrig.data) {
				file.properURL = `/i/${parse(file.path).base}`;
				file.thumbPath = proxyImg(file.properURL);
				thumbs.push(file);
			}
			alreadyThumbed = true;
		}
		getAllImgs()
			.then((data: dbDoc[]) => {
				for (const i in data) {
					data[i].path = join(filesPath, data[i].imgId);
					data[i].properURL = `/i/${parse(data[i].path).base}`;
					data[i].thumbPath = proxyImg(data[i].properURL);
					const updated = new dbDocModel(data[i]);
					console.log(data[i])
					dbDocModel.findOneAndUpdate({imgId: data[i].imgId}, updated, (err, doc) => {
						if (err) {
							console.log(err);
						}
					})
				}
				filesOrig = paginate(data, page || 1, 10);
				console.log(filesOrig)
			});
		const tores: thumbReturn = {thumbs: filesOrig, pagination: filesOrig};
		resolve(tores);
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

export default router;
