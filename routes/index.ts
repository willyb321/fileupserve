///<reference path="../node_modules/@types/node/index.d.ts"/>
import * as express from 'express';

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
	res.status(403);
	res.end('<p>nah</p>')
});

export default router;
