const nanoid = require('nanoid');
const Datastore = require('nedb-core');
db = new Datastore({filename: require('path').join(__dirname, 'imgDb.db'), autoload: true});

function insertImg(id, filename, path) {
	return new Promise(async (resolve, reject) => {
		const already = await imageInDB(id);
		if (already.exists) {
			resolve(already);
		} else {
			db.insert({
				_id: id,
				filename,
				path
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
