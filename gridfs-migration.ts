import * as mongoose from "mongoose";
import {db, dbDoc, dbDocModel} from "./routes/dbutils";
import {createReadStream} from "fs";

db.on('error', console.error.bind(console, 'connection error:'));
let Attachment;
let gridfs;
db.once('open', () => {
	console.log('Connected!');
	gridfs = require('mongoose-gridfs')({
		mongooseConnection: mongoose.connection
	});
	Attachment = gridfs.model;
});

dbDocModel.find({})
	.then(docs => {
		let dbCount = 0;
		dbDocModel.count({})
			.then(count => {
				console.log(`dbDocModel count: ${count}`);
				dbCount = count;
			});
		docs.forEach((doc: dbDoc) => {
			//create or save a file
			Attachment.write({
				_id: doc._id,
				filename: doc.filename,
				contentType: doc.mimetype || 'image/png'
			}, createReadStream(doc.path), (err, createdFile) => {
				if (err) {
					console.error(err);
				} else {
					console.log(createdFile);
				}
			});
			Attachment.count({})
				.then(count => {
					console.log(`Attachments count: ${count}, Imgs count: ${dbCount}`);
				});

		});
	})
	.catch(err => {
		console.log(err);
	});
