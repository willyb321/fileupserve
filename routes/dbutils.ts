const Datastore = require('nedb-core');
const db = new Datastore({filename: require('path').join(__dirname, 'imgDb.db'), autoload: true});

export interface checkDB {
	exists: boolean;
	doc: dbDoc;
}

export interface dbDoc {
	_id: string;
	filename: string;
	path: string;
	mimetype: string;
}

/**
 * Insert image id into db and some other info.
 * @param {object} info - multer file object.
 * @returns {Promise.<object>} - The doc and also whether it was inserted.
 */
export function insertImg(info) {
	const {filename, path, mimetype} = info;
	return new Promise<checkDB>(async (resolve, reject) => {
		const already: checkDB = await imageInDB(filename);
		if (already.exists) {
			resolve(already);
		} else {
			db.insert({
				_id: filename,
				filename,
				path,
				mimetype
			}, (err, newDoc) => {
				if (err) {
					reject(err);
				} else {
					resolve({exists: true, doc: newDoc})
				}
			})
		}
	})
}

/**
 * Checks if image is already in database.
 * @param {string} id - _id
 * @returns {Promise.<checkDB>} - if in db already, doc and exists: true else exists: false
 */
function imageInDB(id) {
	return new Promise<checkDB>((resolve, reject) => {
		db.findOne({_id: id}, (err, doc) => {
			if (err) {
				reject(err);
			}
			if (doc) {
				resolve({exists: true, doc});
			} else {
				resolve({exists: false, doc: null});
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
		db.findOne({_id: id}, (err: Error, doc) => {
			if (err) {
				reject(err);
			}
			if (doc) {
				resolve({exists: true, doc});
			} else {
				resolve({
					exists: false,
					doc: {
						_id: null,
						filename: null,
						path: null,
						mimetype: null
					}
				})
			}
		})
	})
}