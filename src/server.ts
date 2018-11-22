/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as express from 'express';
import util from "./Utils/util";
import * as bodyParser from 'body-parser'
import { Person } from './Models/person'
import { User } from './Models/models'
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

app.post('/api/login', async function(req, res, next) {
  try {
    const user: User = req.body.user

    let foundUser = await DataProvider.getUser(user)
    let sendUser = {...foundUser}
    delete sendUser.containerid
    res.send(sendUser)
    /*
    if (user.name === "Lars Liden") {
      res.send(StartState.READY)
    }
    else {
      res.send(StartState.INVALID)
    }*/
  } catch (error) {
    res.sendStatus(500)
  }
});

app.post('/api/testresults', async function(req, res, next) {
  try {
    const testResults: TestResult[] = req.body.testResults
    const hwmid = req.headers["have_we_met_header"]
    if (typeof hwmid != "string") {
      res.sendStatus(400)
      return
    }
    const user = await DataProvider.userFromId(hwmid as string)
    if (!user) {
      res.sendStatus(400)
      return
    }
    DataProvider.postTestResults(user, testResults)
    res.sendStatus(200)
  } catch (error) {
    res.sendStatus(500)
  }
})


app.get('/api/people/:letter', async function(req, res, next) {
  try {
    const { letter } = req.params
    const hwmid = req.headers["have_we_met_header"]
    if (typeof hwmid != "string") {
      res.send(400)
      return
    }
    const user = await DataProvider.userFromId(hwmid as string)
    if (!user) {
      res.sendStatus(400)
      return
    }
    const people = await DataProvider.getPeopleStartingWith(user, letter)
    res.send(people)
    
  } catch (error) {
    res.sendStatus(500)
  }
})

app.put('/api/person', async function(req, res, next) {
  try {
    const person: Person = req.body.person
    const hwmid = req.headers["have_we_met_header"]
    if (typeof hwmid != "string") {
      res.sendStatus(400)
      return
    }
    const user = await DataProvider.userFromId(hwmid as string)
    if (!user) {
      res.sendStatus(400)
      return
    }
    
    await DataProvider.putPerson(user, person)
    res.sendStatus(200)

  } catch (error) {
    res.sendStatus(400)
  }
})

app.delete('/api/person/:key/:personGUID', async function(req, res, next) {
  try {
    const { personGUID, key } = req.params
    const hwmid = req.headers["have_we_met_header"]
    if (typeof hwmid != "string") {
      res.sendStatus(400)
      return
    }
    const user = await DataProvider.userFromId(hwmid as string)
    if (!user) {
      res.sendStatus(400)
      return
    }
    await DataProvider.deletePerson(user, key, personGUID)
    res.sendStatus(200)

  } catch (error) {
    res.sendStatus(400)
  }
})

app.put('/api/person/:personGUID/image', async function(req, res, next) {
  try {
    const jsonImage: string = req.body.image
    const { personGUID } = req.params
    const hwmid = req.headers["have_we_met_header"]
    if (typeof hwmid != "string") {
      res.sendStatus(400)
      return
    }
    const user = await DataProvider.userFromId(hwmid as string)
    if (!user) {
      res.sendStatus(400)
      return
    }

    let buffer = Buffer.from(JSON.parse(jsonImage));
    await DataProvider.putPersonImage(user, personGUID, buffer)
    res.sendStatus(200)
  } catch (error) {
    res.sendStatus(500)
  }
})

app.post('/api/import', async function(req, res, next) {
  try {
    const hwmid = req.headers["have_we_met_header"]
    if (typeof hwmid != "string") {
      res.sendStatus(400)
      return
    }
    const user = await DataProvider.userFromId(hwmid as string)
    if (!user) {
      res.sendStatus(400)
      return
    }

    await util.UploadLocalFiles(user)
    res.sendStatus(200)
  } catch (error) {
    res.sendStatus(500)
  }
})
