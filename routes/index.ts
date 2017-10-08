///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {join, parse} from "path";
import * as klawSync from 'klaw-sync';
import * as sharp from 'sharp';
import * as basicAuth from "express-basic-auth";
import * as fs from 'fs-extra';

const router = express.Router();
let thumbs = [];
let alreadyThumbed = false;

/* GET home page. */
router.get('/', basicAuth({
	challenge: true,
	users: {
		uploader: process.env.FILEUPSERVE_PW
	}
}), (req, res) => {
	getThumbsForGallery()
		.then(thumbs => {
			res.render('index', {
				thumbs: thumbs,
				title: 'images and stuff'
			})
		})
});
const thumbsPath = join(__dirname, '..', '..', 'public', 'thumbs');

fs.watch(join(__dirname, '..', 'uploads'), async (eventType, filename) => {
	console.log(`event type is: ${eventType}`);
	if (filename && eventType === 'change') {
		filename = join(__dirname, '..', 'uploads', filename);
		console.log(`filename provided: ${filename}`);
		const updated = await sharpie({path: filename});
		thumbs.push(updated);
	} else {
		console.log('filename not provided');
	}
	alreadyThumbed = true;
});

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
					let temp = await sharpie(file);
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

function sharpie(file) {
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
