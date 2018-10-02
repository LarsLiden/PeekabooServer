import * as express from 'express';
//import util from "./Utils/util";
import * as bodyParser from 'body-parser'
import { QuizPerson } from './Models/quizPerson'
//import * as path from 'path'
//import BlobService from './Utils/blobHandler'
import DataProvider from './dataProvider'
import * as cors from 'cors'

//const port = 4040;
//const server = express.listen(port, function() {
//  console.log('Express server listening on port ' + port);
//}); 

var app        = express();    

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router
router.use(cors())

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/quiz', function(req, res) {
  try {

    const qPeople = DataProvider.people.map(p => {
        return {
          fullName: p.FullName,
          blobNames: p._photoFNs
        } as QuizPerson
    })
    //const key = getMemoryKey(req)
    //const query = url.parse(req.url).query || ''
    //const apps = await client.GetApps(query)

    res.send(qPeople)
  } catch (error) {
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

export async function run() {
 // util.UploadLocalFiles()
 await DataProvider.init()
 DataProvider.people.forEach(p => console.log(p.FullName))
}

run()
