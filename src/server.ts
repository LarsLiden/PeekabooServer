/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as express from 'express';
import util, { GetContainer, ContainerType } from "./Utils/util";
import * as bodyParser from 'body-parser'
import { Person } from './Models/person'
import { User } from './Models/models'
import { TestResult } from './Models/performance'
import DataProvider from './dataProvider'
import * as cors from 'cors'

var app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
  limit: '10mb'
}));
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
    let sendUser: any = {...foundUser}
    delete sendUser.containerid
    sendUser.photoContainerId = GetContainer(foundUser, ContainerType.FACES)
    res.send(sendUser)
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

app.put('/api/person/:key/:personGUID/photo', async function(req, res, next) {
  try {
    const imageData: string = req.body.photo
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
    let photoName = await DataProvider.putPhoto(user, key, personGUID, imageData)
    res.send(photoName)
  } catch (error) {
    res.sendStatus(500)
  }
})

app.delete('/api/person/:key/:personGUID/photo/:name', async function(req, res, next) {
  try {
    const { key, personGUID, name } = req.params
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
    await DataProvider.deletePhoto(user, key, personGUID, name)
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
