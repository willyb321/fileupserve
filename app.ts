import * as express from 'express';
import * as logger from 'morgan';
import * as cookieParser from "cookie-parser";
import * as sassMiddleware from 'node-sass-middleware'
import * as favicon from 'serve-favicon'
import * as bodyParser from 'body-parser';
import index from './routes/index';
import upload from './routes/upload';
import img from './routes/img';
import {join} from 'path';
import * as responseTime from 'response-time';

const app = express();
app.use((req, res, next) => {
	res.setHeader('X-Robots-Tag', 'noindex');
	next();
});

app.get('/robots.txt', (req, res) => {
	res.type('text/plain');
	res.send("User-agent: *\nDisallow: /");
});
app.use(responseTime());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// view engine setup
app.set('views', join(__dirname, '..', 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(sassMiddleware({
	src: join(__dirname, '..', 'public'),
	dest: join(__dirname, '..', 'public'),
	indentedSyntax: true, // true = .sass and false = .scss
	sourceMap: true
}));
app.use(express.static(join(__dirname, '..', 'public')));
app.use('/thumbs/:id', express.static(join(__dirname, '..', 'public', 'thumbs')));
app.use('/', index);
app.use('/i', img);
app.use('/upload', upload);

export default app;
