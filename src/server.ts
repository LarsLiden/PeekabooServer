/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as express from 'express';
import diskImport from "./Utils/diskImport";
import * as bodyParser from 'body-parser'
import { Person } from './Models/person'
import { User, toClientUser} from './Models/user'
import { TestResult } from './Models/performance'
import DataProvider from './dataProvider'
import * as appInsights  from 'applicationinsights'
import * as cors from 'cors'

appInsights.setup()
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true)
  .setUseDiskRetryCaching(true)
  .start();

let client = appInsights.defaultClient

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
    res.status(500).send(JSON.stringify(error.stack))
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
    res.status(500).send(JSON.stringify(error.stack))
  }
})

app.get('/api/users', async function(req, res, next) {
//  try {
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
  /*} catch (error) {
    res.status(500).send(JSON.stringify(error.stack))
  }*/
})

// Delete a user
app.delete('/api/user/:deleteHwmid', async function(req, res, next) {
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

    const { deleteHwmid } = req.params
    if (deleteHwmid === hwmid) {
      res.sendStatus(401)
      return
    }
    
    await DataProvider.deleteUser(user, deleteHwmid)
    res.sendStatus(200)
  } catch (error) {
    res.status(500).send(JSON.stringify(error.stack))
  }
})

// Copy to user
app.post('/api/user/:destinationId', async function(req, res, next) {
  try {
    const hwmid = req.headers["have_we_met_header"]
    if (typeof hwmid != "string") {
      res.sendStatus(400)
      return
    }
    const sourceUser = await DataProvider.userFromId(hwmid as string)
    if (!sourceUser) {
      res.sendStatus(400)
      return
    }
    if (!sourceUser.isAdmin) {
      res.sendStatus(401)
      return
    }
    // Can't copy to self
    const { destinationId } = req.params
    if (destinationId === hwmid) {
      res.sendStatus(401)
      return
    }

    const destUser = await DataProvider.userFromId(destinationId as string)
    if (!destUser) {
      res.sendStatus(400)
      return
    }

    const peopleIds: string[] = req.body.peopleIds
    await DataProvider.copyPeople(sourceUser, destUser, peopleIds)
    res.sendStatus(200)
  } catch (error) {
    res.status(500).send(JSON.stringify(error.stack))
  }
})

// Update user stats
app.post('/api/user', async function(req, res, next) {
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
    const updatedUser: User = req.body.user
    if (user.hwmid !== updatedUser.hwmid) {
      res.sendStatus(401)
      return
    }

    await DataProvider.updateUserState(user, updatedUser)

    res.sendStatus(200)
  } catch (error) {
    res.status(500).send(JSON.stringify(error.stack))
  }
})

app.get('/api/people/:letter', async function(req, res, next) {
  try {
   
    const { letter } = req.params
    client.trackEvent({name: `Letter`, properties: {letter}}) // LARS TEMP

    const hwmid = req.headers["have_we_met_header"]
    if (typeof hwmid != "string") {
      res.send(400)
      return
    }

    client.trackEvent({name: `UserFromId`, properties: {hwmid}}) // LARS TEMP

    const user = await DataProvider.userFromId(hwmid as string)
    if (!user) {
      res.sendStatus(400)
      return
    }

    client.trackEvent({name: `GetPeopleStartingWith`, properties: {letter}}) // LARS TEMP

    const people = await DataProvider.getPeopleStartingWith(user, letter)

    client.trackEvent({name: `Send`, properties: {letter}}) // LARS TEMP

    res.send(people)
  } catch (error) {
    client.trackEvent({name: `ERROR`, properties: {stack: JSON.stringify(error.stack)}})
    res.status(500).send(JSON.stringify(error.stack))
  }
})

// NOTE: Not currently used
app.get('/api/person/:key/:personId', async function(req, res, next) {
  try {
    const { personId } = req.params
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
    let person = await DataProvider.getPerson(user, personId)
    res.send(person)

  } catch (error) {
    res.status(500).send(JSON.stringify(error.stack))
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
    res.status(500).send(JSON.stringify(error.stack))
  }
})

app.delete('/api/person/:personId', async function(req, res, next) {
  try {
    const { personId } = req.params
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
    await DataProvider.deletePerson(user, personId)
    res.sendStatus(200)

  } catch (error) {
    res.status(500).send(JSON.stringify(error.stack))
  }
})

app.put('/api/person/:personId/photo', async function(req, res, next) {
  try {
    const imageData: string = req.body.photo
    const { personId } = req.params
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
    let photoName = await DataProvider.putPhoto(user, personId, imageData)
    res.send(photoName)
  } catch (error) {
    res.status(500).send(JSON.stringify(error.stack))
  }
})

app.delete('/api/person/:personId/photo/:name', async function(req, res, next) {
  try {
    const { personId, name } = req.params
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
    await DataProvider.deletePhoto(user, personId, name)
    res.sendStatus(200)
  } catch (error) {
    res.status(500).send(JSON.stringify(error.stack))
  }
})

app.post('/api/person/:personId/archive', async function(req, res, next) {
  try {
    const { personId } = req.params
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
    await DataProvider.archive(user, personId)
    res.send(200)
  } catch (error) {
    res.status(500).send(JSON.stringify(error.stack))
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

    diskImport.UploadLocalFiles(user)
    res.sendStatus(200)
  } catch (error) {
    res.status(500).send(JSON.stringify(error.stack))
  }
})
