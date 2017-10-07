///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';
import {join, parse} from "path";
import * as klawSync from 'klaw-sync';
import * as sharp from 'sharp';

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
	getThumbsForGallery()
		.then(thumbs => {
			res.render('index', {
				thumbs: thumbs,
				title: 'images and stuff'
			})
		})
});
const thumbsPath = join(__dirname, '..', '..', 'public', 'thumbs');
function getThumbsForGallery() {
	return new Promise<Array<any>>(async (resolve, reject) => {
		const filesOrig = klawSync(join(__dirname, '..', 'uploads'), {nodir: true});
		const thumbsOrig = klawSync(join(__dirname, '..', '..', 'public', 'thumbs'), {nodir: true});
		let thumbs = [];
		// console.log(filesOrig);
		thumbsOrig.forEach(thumb => {
			filesOrig.forEach((file, ind) => {
				filesOrig[ind].thumbed = parse(file.path).base === parse(thumb.path).base;
				file.index = ind;
			})
		});
		for (const file of filesOrig) {
			if (!file.thumbed) {
				await sharp(file.path)
					.resize(320, 240)
					.toFile(join(thumbsPath, parse(file.path).base))
					.then(info => {
						info.path = `/thumbs/${parse(file.path).base}`;
						info.properURL = `/i/${parse(file.path).base}`;
						thumbs.push(info);
					})
					.catch(err => {
						console.log(err);
					})
			} else {
				file.path = `/thumbs/${parse(file.path).base}`;
				file.properURL = `/i/${parse(file.path).base}`;
				thumbs.push(file);
			}
		}
		resolve(thumbs);
	})
}
export default router;
