import * as express from 'express';
import * as logger from 'morgan';
import * as cookieParser from "cookie-parser";
import * as sassMiddleware from 'node-sass-middleware'
import * as favicon from 'serve-favicon';
import * as bodyParser from 'body-parser';
import {join} from 'path';
import * as responseTime from 'response-time';
import * as fs from 'fs-extra';
import * as passport from "passport";
import * as Auth0Strategy from 'passport-auth0';
import * as session from 'express-session';
import * as connect_mongo from 'connect-mongo';
import 'source-map-support/register';

fs.ensureDirSync(join(__dirname, '..', 'public', 'thumbs'));
fs.ensureDirSync(join(__dirname, 'uploads'));

import index from './routes/index';
import upload from './routes/upload';
import img from './routes/img';
import shorten from './routes/shorten';
import stats from './routes/shortenstats';

const flash = require('connect-flash');
process.on('uncaughtException', (err: Error) => {
	console.log(err);
});

process.on('unhandledRejection', (err: Error) => {
	console.log(err);
});
// Configure Passport to use Auth0
const strategy = new Auth0Strategy(
	{
		domain: process.env.AUTH0_DOMAIN,
		clientID: process.env.AUTH0_CLIENTID,
		clientSecret: process.env.AUTH0_CLIENTSECRET,
		callbackURL: process.env.AUTH0_CALLBACKURL || 'http://localhost:3000/callback'
	},
	(accessToken, refreshToken, extraParams, profile, done) => {
		return done(null, profile);
	}
);

passport.use(strategy);

// This can be used to keep a smaller payload
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
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

const MongoStore = connect_mongo(session);
// view engine setup
app.set('views', join(__dirname, '..', 'views'));
app.set('view engine', 'pug');
if (process.env.NODE_ENV === 'production') {
	app.set('trust proxy', 1);
}
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	cookie: {
		secure: process.env.NODE_ENV === 'production' ? true : false,

	},
	saveUninitialized: false,
	proxy: true,
	store: new MongoStore({url: process.env.MONGO_URL, touchAfter: 24 * 3600})
}));

app.use(passport.initialize());
app.use(passport.session());


app.use(flash());

// Handle auth failure error messages
app.use((req: any, res, next) => {
	if (req && req.query && req.query.error) {
		req.flash("error", req.query.error);
	}
	if (req && req.query && req.query.error_description) {
		req.flash("error_description", req.query.error_description);
	}
	next();
});

app.use(sassMiddleware({
	src: join(__dirname, '..', 'public'),
	dest: join(__dirname, '..', 'public'),
	indentedSyntax: true, // true = .sass and false = .scss
	sourceMap: true
}));

// Check logged in
app.use((req, res, next) => {
	res.locals.loggedIn = req.session.passport && typeof req.session.passport.user != 'undefined';
	next();
});

app.use(express.static(join(__dirname, '..', 'public'), {maxAge: cacheTime}));
app.use('/thumbs/:id', express.static(join(__dirname, '..', 'public', 'thumbs'), {maxAge: cacheTime}));
app.use('/', index);
app.use('/i', img);
app.use('/upload', upload);
app.use('/sh', shorten);
app.use('/stats', stats);

export default app;
