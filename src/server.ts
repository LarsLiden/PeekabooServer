import * as express from 'express';
import util from "./Utils/util";
import * as bodyParser from 'body-parser'
import { Person } from './Models/person'
import { StartState } from './Models/models'
import { TestResult } from './Models/performance'
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
/*function getQuery (req: express.Request): any {
  return url.parse(req.url, true).query || {}
}*/

app.get('/api/test', function(req, res, next) {
  try {
    res.send("Success!")
  } catch (error) {
    res.send(error)
  }
});

app.post('/api/start', function(req, res, next) {
  try {
    const name: string = req.body.name
    if (name === "lars") {
      res.send(StartState.READY)
    }
    else {
      res.send(StartState.INVALID)
    }
  } catch (error) {
    res.send(error)
  }
});

app.post('/api/testresults', function(req, res, next) {
  try {
    const testResults: TestResult[] = req.body.testResults

    DataProvider.postTestResults(testResults)
    res.sendStatus(200)
  } catch (error) {
    res.send(error)
  }
})

app.get('/api/people/:letter', async function(req, res, next) {
  try {
    const { letter } = req.params
    const people = await DataProvider.getPeopleStartingWith(letter)
    res.send(people)
  } catch (error) {
    res.send(error)
  }
})

app.put('/api/person', function(req, res, next) {
  try {
    const person: Person = req.body.person

    DataProvider.putPerson(person)
    res.sendStatus(200)
  } catch (error) {
    res.send(error)
  }
})

app.put('/api/person/:personGUID/image', async function(req, res, next) {
  try {
    const jsonImage: string = req.body.image
    const { personGUID } = req.params

    let buffer = Buffer.from(JSON.parse(jsonImage));
    await DataProvider.putPersonImage(personGUID, buffer)
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
})
