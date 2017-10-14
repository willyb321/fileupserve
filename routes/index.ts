///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {join, parse} from 'path';
import * as klawSync from 'klaw-sync';
import * as sharp from 'sharp';
import * as basicAuth from "express-basic-auth";
import * as fs from 'fs-extra';
import * as paginate from 'paginate-array';

const router: express.Router = express.Router();
let thumbs: Array<thumbObj | fileObj> = [];
let alreadyThumbed: boolean = false;
const thumbsPath: string = join(__dirname, '..', '..', 'public', 'thumbs');
const filesPath: string = join(__dirname, '..', 'uploads');

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
					for (const i of thumbs.thumbs) {
						if (i) {
							const urlcap = `${req.get('X-Forwarded-Proto') || req.protocol}://${req.get('X-Forwarded-Host') || req.get('host')}/i/${parse(i.path).base}`;
							captions.push(urlcap)
						}
					}
					res.render('index', {
						thumbs: thumbs.thumbs,
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

interface thumbObj extends sharp.OutputInfo {
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

function getThumbsForGallery(page?: number) {
	return new Promise(async resolve => {
		let allFiles: ReadonlyArray<fileObj> = klawSync(filesPath, {nodir: true});
		let allThumbs: ReadonlyArray<fileObj> = klawSync(thumbsPath, {nodir: true});
		const date = new Date();
		const refTime = new Date().setDate(date.getDate() - 3);
		const filterFn = item => item.stats.mtime.getTime() > refTime;
		const options: klawOpts = {nodir: true, filter: filterFn};
		const filesOrig = paginate(allFiles, page || 1, 10);
		const thumbsOrig = paginate(allThumbs, page || 1, 10);
		thumbs = thumbs.slice(9, thumbs.length - 1);
		alreadyThumbed = false;
		filesOrig.data.forEach((file, ind) => {
			if (!filesOrig.data.find(elem => hasAThumb(elem, thumbsOrig.data))) {
				filesOrig.data[ind].thumbed = false;
			}
		});
		if (!alreadyThumbed) {
			for (const file of filesOrig.data) {
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
		const tores: thumbReturn = {thumbs, pagination: thumbsOrig};
		resolve(tores);
	})
}
interface thumbReturn {
	thumbs: Array<thumbObj | fileObj>;
	pagination: any;
}
export function sharpie(file: fileObj) {
	return sharp(file.path)
		.resize(320, 240)
		.toFile(join(thumbsPath, parse(file.path).base))
		.then((info: thumbObj) => {
			info.path = `/thumbs/${parse(file.path).base}`;
			info.properURL = `/i/${parse(file.path).base}`;
			info.filePath = join(thumbsPath, parse(file.path).base);
			return info;
		})
		.catch(err => {
			console.log(err);
			return err;
		})
}

export default router;
