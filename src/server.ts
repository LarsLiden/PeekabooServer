/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as express from 'express';
import util from "./Utils/util";
import * as bodyParser from 'body-parser'
import { Person } from './Models/person'
import { User, toClientUser} from './Models/user'
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

    let clientUser = toClientUser(foundUser)
    res.send(clientUser)
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
    let people = await DataProvider.postTestResults(user, testResults)
    res.send(people)
  } catch (error) {
    res.sendStatus(500)
  }
})

app.get('/api/users', async function(req, res, next) {
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
    if (!user.isAdmin) {
      res.sendStatus(401)
      return
    }
    let users = await DataProvider.getUsers(user)
    res.send(users)
  } catch (error) {
    res.sendStatus(500)
  }
})

app.delete('/api/user/:deleteId', async function(req, res, next) {
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
    if (!user.isAdmin) {
      res.sendStatus(401)
      return
    }

    const { deleteId } = req.params
    if (deleteId === hwmid) {
      res.sendStatus(401)
      return
    }
    
    await DataProvider.deleteUser(user, deleteId)
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

// NOTE: Not currently used
app.get('/api/person/:key/:personGUID', async function(req, res, next) {
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
    let person = await DataProvider.getPerson(user, key, personGUID)
    res.send(person)

  } catch (error) {
    res.sendStatus(400)
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

app.post('/api/person/:key/:personGUID/archive', async function(req, res, next) {
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
    if (!user.isAdmin) {
      res.sendStatus(401)
    }
    await DataProvider.archive(user, key, personGUID)
    res.send(200)
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
