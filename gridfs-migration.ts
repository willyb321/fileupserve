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
			const stream = createReadStream(doc.path);
			stream.on('error', console.error);
			//create or save a file
			Attachment.write({
				filename: doc.filename,
				contentType: doc.mimetype || 'image/png',
				metadata: {
					imgId: doc.imgId
				}
			}, stream, (err, createdFile) => {
				if (err) {
					console.error(err);
				} else {
					console.log(createdFile);
					dbDocModel.update({_id: doc._id}, {gridId: createdFile._id, properURL: `/i/${createdFile.filename}.png`})
						.catch(err => {
							console.error(err);
						})
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
