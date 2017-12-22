///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {join, parse} from 'path';
import * as klawSync from 'klaw-sync';
import * as sharp from 'sharp';
import * as basicAuth from "express-basic-auth";
import * as fs from 'fs-extra';
import * as paginate from 'paginate-array';
import * as _ from 'lodash';
import {getAllImgs, dbDocModel} from "./dbutils";
import * as mongoose from "mongoose";
import * as crypto from 'crypto';
import * as probe from 'probe-image-size';
import {readFileSync} from "fs";

const router: express.Router = express.Router();
let thumbs = [];
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
		const data: any = await getAllImgs();
		for (const i in data) {
			if (data.hasOwnProperty(i)) {
				let probed;
				try {
					if (!data[i].width || data[i].height) {
						probed = probe.sync(readFileSync(data[i].path));
					}
				} catch (err) {
					if (err.code === 'ENOENT') {
						// no-op
					} else {
						console.log(err);
					}
				}
				if (probed && probed.width && probed.height) {
					data[i].width = probed.width;
					data[i].height = probed.height;
				}
				data[i].path = join(filesPath, data[i].imgId);
				data[i].properURL = `/i/${parse(data[i].path).base}`;
				data[i].thumbPath = proxyImg(data[i].properURL);
				const updated = new dbDocModel(data[i]);
				dbDocModel.findOneAndUpdate({imgId: data[i].imgId}, updated)
					.catch(err => {
						if (err) {
							console.log(err);
						}
					})
			}
		}
		filesOrig = paginate(data, page || 1, 10);
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
