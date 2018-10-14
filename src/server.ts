import * as express from 'express';
import util from "./Utils/util";
import * as bodyParser from 'body-parser'
import { QuizPerson, Filter } from './Models/models'
import DataProvider from './dataProvider'
import * as cors from 'cors'

var app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var port = process.env.PORT || 8080;    
app.listen(port, () => {
  console.log('We are live on ' + port);
});

// ROUTES FOR OUR API
// =============================================================================
app.get('/api/test', function(req, res, next) {
  try {
    res.send("Success!")
  } catch (error) {
    res.send(error)
  }
});

app.get('/api/quiz', function(req, res, next) {
  try {

    const qPeople = DataProvider.people
      .filter(p => p.photoFilenames.length > 0)
      .map(p => {
        return {
          fullName: p.fullName,
          blobNames: p.photoFilenames
        } as QuizPerson
    })

    res.send(qPeople)
  } catch (error) {
      res.send(error)
  }
});

app.get('/api/tags', function(req, res, next) {
  try {
    const tags = DataProvider.tags
    res.send(tags)
  } catch (error) {
      res.send(error)
  }
});

app.post('/api/tags', function(req, res, next) {
  try {
    const filter: Filter = req.body.filter
    const tags = DataProvider.filteredTags(filter)
    res.send(tags)
  } catch (error) {
    res.send(error)
  }
});

app.post('/api/quizset', function(req, res, next) {
  try {
    const filter: Filter = req.body.filter

    const quizSet = DataProvider.quizSet(filter)
    res.send(quizSet)
  } catch (error) {
    res.send(error)
  }
});

app.post('/api/import', function(req, res, next) {
  try {
    util.UploadLocalFiles()
    res.send(200)
  } catch (error) {
    res.send(error)
  }
});

// =============================================================================
// START THE SERVER
// =============================================================================

export async function run() {
 // util.UploadLocalFiles()
 await DataProvider.init()
 DataProvider.people.forEach(p => console.log(p.fullName))
}

run()
