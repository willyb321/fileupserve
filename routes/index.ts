///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {join, parse} from 'path';
import * as klawSync from 'klaw-sync';
import * as sharp from 'sharp';
import * as basicAuth from "express-basic-auth";

const router = express.Router();
let thumbs = [];
let alreadyThumbed = false;
const thumbsPath = join(__dirname, '..', '..', 'public', 'thumbs');

getThumbsForGallery()
	.then(() => {
		console.log('main page ready');

		router.get('/', basicAuth({
			challenge: true,
			users: {
				uploader: process.env.FILEUPSERVE_PW
			}
		}), (req, res) => {
			getThumbsForGallery()
				.then(thumbs => {
					let captions = [];
					for (const i of thumbs) {
						const urlcap = `https://${req.get('X-Forwarded-Host') || req.get('host')}/i/${parse(i.path).base}`;
						captions.push(urlcap)
					}
					res.render('index', {
						thumbs: thumbs,
						captions,
						title: 'Images and stuff'
					})
				})
		});

	});

export async function newUpload(filename) {
	console.log(`filename provided: ${filename}`);
	const updated = await sharpie({path: filename});
	thumbs.push(updated);
	alreadyThumbed = true;
}

export interface thumbObj {
		format: string;
		width: number;
		height: number;
		channels: number;
		size: number;
		path: string;
		properURL: string;
}

function getThumbsForGallery() {
	return new Promise<Array<any>>(async resolve => {
		const date = new Date();
		const refTime = new Date().setDate(date.getDate() - 1);
		const filterFn = item => item.stats.mtime.getTime() > refTime;
		const filesOrig = klawSync(join(__dirname, '..', 'uploads'), {nodir: true, filter: filterFn});
		const thumbsOrig = klawSync(join(__dirname, '..', '..', 'public', 'thumbs'), {nodir: true, filter: filterFn});
		thumbsOrig.forEach(thumb => {
			filesOrig.forEach((file, ind) => {
				filesOrig[ind].thumbed = parse(file.path).base === parse(thumb.path).base;
			})
		});
		if (!alreadyThumbed) {
			for (const file of filesOrig) {
				if (!file.thumbed) {
					let temp: thumbObj = await sharpie(file);
					thumbs.push(temp);
				} else {
					file.path = `/thumbs/${parse(file.path).base}`;
					file.properURL = `/i/${parse(file.path).base}`;
					thumbs.push(file);
				}
			}
			alreadyThumbed = true;
		}
		resolve(thumbs);
	})
}

export function sharpie(file) {
	return sharp(file.path)
		.resize(320, 240)
		.toFile(join(thumbsPath, parse(file.path).base))
		.then(info => {
			info.path = `/thumbs/${parse(file.path).base}`;
			info.properURL = `/i/${parse(file.path).base}`;
			return info;
		})
		.catch(err => {
			console.log(err);
			return err;
		})
}

export default router;
