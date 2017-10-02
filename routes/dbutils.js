const Datastore = require('nedb-core');
const db = new Datastore({filename: require('path').join(__dirname, 'imgDb.db'), autoload: true});

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
