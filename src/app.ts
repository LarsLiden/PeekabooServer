import * as express from "express";


class App {

  constructor() {
    this.express = express();
  }

  public express: express.Application;

}

export default new App().express;