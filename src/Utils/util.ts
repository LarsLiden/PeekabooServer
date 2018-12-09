/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
import { Person } from '../Models/person'
import { User } from '../Models/user'

export enum ContainerType { 
    PHOTOS = "photos-",
    DATA = "data-hwm-",
    ARCHIVE_PHOTOS = "archive-photos-",
    ARCHIVE_DATA = "archive-data-hwm-"
}

export function GetContainer(user: User, type: ContainerType) {
    return `${type}${user.containerId}`
}

export function generateSaveName(firstName: string, lastName: string): string {

    let d = new Date().getTime()
    let id = 'xxxxx'.replace(/[xy]/g, char => {
      let r = ((d + Math.random() * 16) % 16) | 0
      d = Math.floor(d / 16)
      return (char === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })

    let baseName = `${firstName}_${lastName}`.replace(/[\W_]+/g, "").replace(" ", "")
    return `${baseName}_${id}`
}

export function generateGUID(): string {
    let d = new Date().getTime()
    let guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
      let r = ((d + Math.random() * 16) % 16) | 0
      d = Math.floor(d / 16)
      return (char === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
    return guid
}

export function cacheKey(user: User, letter: string): string {
    return `${letter}_${user.containerId}`
} 

export function cacheKeyFromUser(user: User, person: Person): string {
    return `${personKey(person)}_${user.containerId}`
} 

export function keyFromPersonId(personId: string): string {
    return personId![0].toUpperCase()
}
export function personKey(person: Person): string {
    return keyFromPersonId(person.personId)
} 

export function getPhotoURI(containerName: string, person: Person, photoName: string) {
    return `https://peekaboo.blob.core.windows.net/${containerName}/${getPhotoBlobName(person, photoName)}`
}

export function getPersonBlobName(person: Person) {
    const savePrefix = keyFromPersonId(person.personId)
    return savePrefix +'\\' + person.personId +'.json'
}
export function getPhotoBlobName(person: Person, photoName: string) {
    return `${personKey(person)}/${person.personId}/${photoName}`
}

export function getNextPhotoName(person: Person): string {
    let index = 1
    while (true) {
        let saveName = `${person.personId}_${index}.png`
        if (person.photoFilenames.includes(saveName)) {
            index = index + 1
        }
        else {
            return saveName
        }
    }
}