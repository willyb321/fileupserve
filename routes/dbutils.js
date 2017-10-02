const Datastore = require('nedb-core');
const db = new Datastore({filename: require('path').join(__dirname, 'imgDb.db'), autoload: true});

/**
 * Insert image id into db and some other info.
 * @param {object} info - multer file object.
 * @returns {Promise.<object>} - The doc and also whether it was inserted.
 */
function insertImg(info) {
	const {filename, path, mimetype} = info;
	return new Promise(async (resolve, reject) => {
		const already = await imageInDB(filename);
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
					resolve({inserted: true, doc: newDoc})
				}
			})
		}
	})
}

/**
 * Checks if image is already in database.
 * @param {string} id - _id
 * @returns {Promise.<object>} - if in db already, doc and exists: true else exists: false
 */
function imageInDB(id) {
	return new Promise((resolve, reject) => {
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
function getImg(id) {
	return new Promise((resolve, reject) => {
		db.findOne({_id: id}, (err, doc) => {
			if (err) {
				reject(err);
			}
			if (doc) {
				doc.exists = true;
				resolve(doc);
			} else {
				resolve({exists: false})
			}
		})
	})
}

module.exports = {
	insertImg,
	getImg
};
