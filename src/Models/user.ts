/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
import { GetContainer, ContainerType } from '../Utils/util'

export interface User extends ClientUser {
    createdDateTime: string
    lastUsedDatTime: string
    containerId: string
}

export interface ClientUser {
    name: string,
    googleId: string,
    email: string,
    hwmid: string,
    photoBlobPrefix: string
    isAdmin?: boolean
}

export function toClientUser(user: User): ClientUser {
    let clientUser: ClientUser =   {
        name: user.name,
        googleId: user.googleId,
        email: user.email,
        hwmid: user.hwmid,
        photoBlobPrefix: GetContainer(user, ContainerType.PHOTOS)
    }
    if (user.isAdmin) {
        clientUser.isAdmin = true
    }
    return clientUser
}