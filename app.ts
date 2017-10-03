import * as express from "express";
import * as logger from "morgan";
import * as cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import index from "./routes/index";
import upload from "./routes/upload";
import img from "./routes/img";

const app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/', index);
app.use('/i', img);
app.use('/upload', upload);

export default app;
