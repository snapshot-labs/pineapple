import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rpc from './rpc';
import upload from './upload';
import proxy from './proxy';
import { version } from '../package.json';
import { stats } from './stats';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ limit: '4mb', extended: false }));
app.use(cors({ maxAge: 86400 }));
app.use('/', rpc);
app.use('/', upload);
app.use('/', proxy);
app.get('/', (req, res) => res.json({ version, port: PORT, stats }));

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));
