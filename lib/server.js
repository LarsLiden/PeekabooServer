"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const util_1 = require("./Utils/util");
//import * as path from 'path'
//import { BlobHandler } from './Utils/blobHandler'
const port = 4040;
app_1.default.listen(port, function () {
    console.log('Express server listening on port ' + port);
});
util_1.default.GetAllFiles();
//let imagedir = path.join(process.cwd(), './data')
//const filename = path.join(imagedir, `ShiSun.jpg`);
//BlobHandler.init()
//BlobHandler.uploadImage("faces", "S/ShiSun/1.jpg", filename)
//# sourceMappingURL=server.js.map