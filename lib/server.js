"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const util_1 = require("./Utils/util");
const bodyParser = require("body-parser");
//import * as path from 'path'
//import BlobService from './Utils/blobHandler'
const dataProvider_1 = require("./dataProvider");
const cors = require("cors");
//const port = 4040;
//const server = express.listen(port, function() {
//  console.log('Express server listening on port ' + port);
//}); 
var app = express();
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var port = process.env.PORT || 8080; // set our port
// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); // get an instance of the express Router
router.use(cors());
router.get('/quiz', function (req, res) {
    try {
        const qPeople = dataProvider_1.default.people
            .filter(p => p._photoFNs.length > 0)
            .map(p => {
            return {
                fullName: p.FullName,
                blobNames: p._photoFNs
            };
        });
        res.send(qPeople);
    }
    catch (error) {
        //HandleError(res, error)
    }
});
router.get('/tags', function (req, res) {
    try {
        const tags = dataProvider_1.default.tags;
        res.send(tags);
    }
    catch (error) {
        //HandleError(res, error)
    }
});
router.post('/tags', function (req, res) {
    try {
        const filter = req.body.filter;
        const tags = dataProvider_1.default.filteredTags(filter);
        res.send(tags);
    }
    catch (error) {
        //HandleError(res, error)
    }
});
router.post('/quizset', function (req, res) {
    try {
        const filter = req.body.filter;
        const quizSet = dataProvider_1.default.quizSet(filter);
        res.send(quizSet);
    }
    catch (error) {
        //HandleError(res, error)
    }
});
router.post('/import', function (req, res) {
    try {
        util_1.default.UploadLocalFiles();
        res.send(200);
    }
    catch (error) {
        //HandleError(res, error)
    }
});
// more routes for our API will happen here
// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
/*
export const router = () => {

  const router = express.Router({ caseSensitive: false })

  
  router.get('/quiz', async (req, res, next) => {
    try {
        //const key = getMemoryKey(req)
        //const query = url.parse(req.url).query || ''
        //const apps = await client.GetApps(query)

        res.send("ok")
    } catch (error) {
        //HandleError(res, error)
    }
  })

}

const server = express()
//server.use("/", router)


server.get('/quiz', async (req, res, next) => {
  try {
      //const key = getMemoryKey(req)
      //const query = url.parse(req.url).query || ''
      //const apps = await client.GetApps(query)

      res.send("ok")
  } catch (error) {
      //HandleError(res, error)
  }
})
//LARS config port
/*const listener = server.listen(3000, () => {
  var host = server.address().address;
  var port = server.address().port;
  console.log(`Server listening to ${JSON.stringify(listener.address())}`)
})*/
//util.UploadLocalFiles()
//let imagedir = path.join(process.cwd(), './data')
//const filename = path.join(imagedir, `ShiSun.jpg`);
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        // util.UploadLocalFiles()
        yield dataProvider_1.default.init();
        dataProvider_1.default.people.forEach(p => console.log(p.FullName));
    });
}
exports.run = run;
run();
//# sourceMappingURL=server.js.map