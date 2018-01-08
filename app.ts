import * as express from 'express';
import * as logger from 'morgan';
import * as cookieParser from "cookie-parser";
import * as sassMiddleware from 'node-sass-middleware'
import * as favicon from 'serve-favicon';
import * as bodyParser from 'body-parser';
import {join} from 'path';
import * as responseTime from 'response-time';
import * as fs from 'fs-extra';
import 'source-map-support/register';

fs.ensureDirSync(join(__dirname, '..', 'public', 'thumbs'));
fs.ensureDirSync(join(__dirname, 'uploads'));

import index from './routes/index';
import upload from './routes/upload';
import img from './routes/img';
import shorten from './routes/shorten';
import shortened from './routes/shortened';

process.on('uncaughtException', (err: Error) => {
	console.log(err);
});

process.on('unhandledRejection', (err: Error) => {
	console.log(err);
});

const app: express.Application = express();
const cacheTime: number = 86400000 * 7;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(favicon(join(__dirname, '..', 'public', 'favicon.ico')));

app.use(responseTime());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// view engine setup
app.set('views', join(__dirname, '..', 'views'));
app.set('view engine', 'pug');

app.use(sassMiddleware({
	src: join(__dirname, '..', 'public'),
	dest: join(__dirname, '..', 'public'),
	indentedSyntax: true, // true = .sass and false = .scss
	sourceMap: true
}));
app.use(express.static(join(__dirname, '..', 'public'), {maxAge: cacheTime}));
app.use('/thumbs/:id', express.static(join(__dirname, '..', 'public', 'thumbs'), {maxAge: cacheTime}));
app.use('/', index);
app.use('/i', img);
app.use('/upload', upload);
app.use('/sh', shorten);
app.use('/s/', shortened);

export default app;
