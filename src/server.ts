import * as express from 'express';
import util from "./Utils/util";
import * as bodyParser from 'body-parser'
import { QuizPerson, Filter, StartState } from './Models/models'
import { TestResult } from './Models/performance'
import DataProvider from './dataProvider'
import * as cors from 'cors'
import * as url from 'url'

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
function getQuery (req: express.Request): any {
  return url.parse(req.url, true).query || {}
}

app.get('/api/test', function(req, res, next) {
  try {
    res.send("Success!")
  } catch (error) {
    res.send(error)
  }
});

app.get('/api/person', function(req, res, next) {
  try {
    const { guid } = getQuery(req)
    let person = DataProvider.getPerson(guid)
    if (!person) { 
      throw new Error("MISSING PERSON")
    }
    const displayPerson = person.toDisplayPerson()
    res.send(displayPerson)
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

app.post('/api/start', function(req, res, next) {
  try {
    const name: string = req.body.name
    if (!DataProvider.isReady()) {
      res.send(StartState.WAITING)
    }
    else if (name === "lars") {
      res.send(StartState.READY)
    }
    else {
      res.send(StartState.INVALID)
    }
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
})

app.post('/api/libraryset', async function(req, res, next) {
  try {
    const filter: Filter = req.body.filter

    const librarySet = await DataProvider.librarySet(filter)
    res.send(librarySet)
  } catch (error) {
    res.send(error)
  }
})


app.post('/api/testresults', function(req, res, next) {
  try {
    const testResults: TestResult[] = req.body.testResults

    DataProvider.postTestResults(testResults)
    res.sendStatus(200)
  } catch (error) {
    res.send(error)
  }
})

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
