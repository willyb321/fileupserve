///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {join, parse} from 'path';
import * as klawSync from 'klaw-sync';
import * as sharp from 'sharp';
import * as basicAuth from "express-basic-auth";
import * as fs from 'fs-extra';
import * as paginate from 'paginate-array';
import * as _ from 'lodash';
import {getAllThumbs, insertThumb} from "./dbutils";
import * as mongoose from "mongoose";

const router: express.Router = express.Router();
let thumbs = [];
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
					for (const i of thumbs.thumbs.data) {
						if (i) {
							const urlcap = `${req.get('X-Forwarded-Proto') || req.protocol}://${req.get('X-Forwarded-Host') || req.get('host')}/i/${parse(i.path).base}`;
							captions.push(urlcap)
						}
					}
					res.render('index', {
						thumbs: thumbs.pagination,
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

function getThumbsForGallery(page?: number) {
	return new Promise(async resolve => {
		let allFiles: ReadonlyArray<fileObj> = klawSync(filesPath, {nodir: true});
		let allFilesSorted = _.cloneDeep(allFiles).sort((a,b) => a.stats.mtime.getUTCMilliseconds() < b.stats.mtime.getUTCMilliseconds());
		const date = new Date();
		allFiles = allFilesSorted;
		const refTime = new Date().setDate(date.getDate() - 3);
		const filesOrig = paginate(allFiles, page || 1, 10);
		// thumbs = thumbs.slice(9, thumbs.length - 1);
		for (const i in filesOrig.data) {
			filesOrig.data[i].path = `/i/${parse(filesOrig.data[i].path).base}`;
			filesOrig.data[i].properURL = `/i/${parse(filesOrig.data[i].path).base}`;
			filesOrig.data[i].filePath = join(thumbsPath, parse(filesOrig.data[i].path).base);
		}
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
