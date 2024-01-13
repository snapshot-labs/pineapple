import fs from 'fs';
import path from 'path';

export default {
  contentType: 'image/webp',
  content: fs.promises.readFile(path.join(__dirname, './valid.webp')),
  alternateContent: fs.promises.readFile(path.join(__dirname, './valid-2.webp')),
  cid: 'bafkreigeulwpsgbb4o5ykgsbpni2trgk6mzdu72f6hienk3b6edol5iyom'
};
