import app from "./app";
import util from "./Utils/util";
//import * as path from 'path'
//import { BlobHandler } from './Utils/blobHandler'

const port = 4040;
app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});

util.GetAllFiles()
//let imagedir = path.join(process.cwd(), './data')
//const filename = path.join(imagedir, `ShiSun.jpg`);

//BlobHandler.init()
//BlobHandler.uploadImage("faces", "S/ShiSun/1.jpg", filename)
