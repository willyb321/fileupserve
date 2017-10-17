import * as mongoose from 'mongoose';
import {thumbObj} from "./index";

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/imgs');
// const db = new Datastore({filename: require('path').join(__dirname, 'imgDb.db'), autoload: true});
export const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('Connected1')
});

export interface checkDB {
	exists: boolean;
	doc: dbDoc;
}

const dbDocSchema = new mongoose.Schema({
	imgId: String,
	filename: String,
	path: String,
	mimetype: String,
	properURL: String
});

const thumbSchema = new mongoose.Schema({
	path: String,
	properURL: String,
	filePath: String,
	format: String,
	size: Number,
	width: Number,
	height: Number,
	channels: Number,
});
export const dbDocModel = mongoose.model('Img', dbDocSchema);
const thumbModel = mongoose.model('Thumb', thumbSchema);

export interface checkThumb {
	exists: boolean;
	doc?: thumbObj;
}

export interface dbDoc extends mongoose.Document {
	imgId: string;
	filename: string;
	path: string;
	mimetype: string;
	properURL: string;
}

/**
 * Insert image id into db and some other info.
 * @param {object} info - multer file object.
 * @returns {Promise.<object>} - The doc and also whether it was inserted.
 */
export function insertImg(info) {
	const {filename, path, mimetype, properURL} = info;
	return new Promise<checkDB>(async (resolve, reject) => {
		const already: checkDB = await imageInDB(filename);
		if (already.exists) {
			resolve(already);
		} else {
			const toInsert = new dbDocModel({
				imgId: filename,
				filename,
				path,
				properURL,
				mimetype
			});
			toInsert.save()
				.then((newDoc: dbDoc) => {
					resolve({exists: true, doc: newDoc})
				})
				.catch(err => {
					reject(err);
				})
		}
	})
}

export function getAllImgs() {
	return dbDocModel.find({}).sort({_id: -1})
}

/**
 * Insert thumbnail info.
 * @param {thumbObj} info
 * @returns {Promise<checkDB>}
 */
export function insertThumb(info: thumbObj) {
	return new Promise<checkThumb>(async (resolve, reject) => {
		thumbModel.findOne(info)
			.then((res: thumbObj) => {
				if (res) {
					console.log(res);
					const doc: checkThumb = {exists: true, doc: res};
					resolve(doc)
				} else {
					const toInsert = new thumbModel(info);
					toInsert.save({}, function (err, newDoc: dbDoc) {
						if (err) {
							reject(err);
						} else {
							const doc: checkThumb = {exists: true, doc: res};
							resolve(doc)
						}
					});
				}
			})
			.catch(err => {
				if (err) {
					reject(err);
				}
			});
	})
}

/**
 * Checks if image is already in database.
 * @param {string} id - _id
 * @returns {Promise.<checkDB>} - if in db already, doc and exists: true else exists: false
 */
function imageInDB(id) {
	return new Promise<checkDB>((resolve, reject) => {
		dbDocModel.findOne({imgId: id}, (err, doc: dbDoc) => {
			if (err) {
				reject(err);
			}
			if (doc) {
				const toReturn: checkDB = {exists: true, doc};
				resolve(toReturn);
			} else {
				const toReturn: checkDB = {exists: false, doc: null};
				resolve(toReturn);
			}
		})
	})
}

/**
 * Gets image by id and returns the info.
 * @param {string} id - _id
 * @returns {Promise.<object>} - The nedb doc.
 */
export function getImg(id) {
	return new Promise<checkDB>((resolve, reject) => {
		dbDocModel.findOne({imgId: id}, (err: Error, doc: dbDoc) => {
			if (err) {
				reject(err);
			}
			if (doc) {
				resolve({exists: true, doc});
			} else {
				reject(null);
			}
		})
	})
}

export function removeImg(id) {
	return new Promise((resolve, reject) => {
		dbDocModel.remove({imgId: id}, (err) => {
			if (err !== null) {
				console.log(err);
				reject({deleted: false, err});
			}
			resolve({deleted: true});
		})
	})
}
