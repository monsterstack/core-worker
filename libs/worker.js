'use strict';
const Promise = require('promise');
const config = require('config');
const appRoot = require('app-root-path');
const QueueWorker = require('redis-queue-worker');
const EventEmitter = require('events').EventEmitter;


class Worker extends EventEmitter {
  constructor(name, announcement, options) {
    super();
    this.id = require('node-uuid').v1();
    this.options = options;
    this.name = name;

    this.announcement = announcement;

    this.types = options.typeQuery || [];
    this.redis = options.redis;

    this.proxyLib = require('discovery-proxy');
    this.proxy = null;

    this.discoveryHost = config.discovery.host;
    this.discoveryPort = config.discovery.port;

    if(options) {
      if(options.discoveryHost) {
        this.discoveryHost = options.discoveryHost;
      }

      if(options.discoveryPort) {
        this.discoveryPort = options.discoveryPort;
      }
    }

    let queue = null;

    if(options) {
      console.log(options);
      if(options.queue) {
        this.queues = options.queue;
      }
    }
  }

  getMe() {
    let descriptor = {
      type: this.name,
      schemaPath: this.announcement.schemaPath,
      docsPath: this.announcement.docsPath,
      timestamp: new Date(),
      id: this.id,
      region: this.announcement.region,
      stage: this.announcement.stage,
      status: 'Online',
      version: this.announcement.version
    };

    let p = new Promise((resolve, reject) => {
      descriptor.endpoint = `q://${this.options.queue}`;
      resolve(descriptor);
    });
    return p;

  }


  init() {
    let self = this;
    let p = new Promise((resolve, reject) => {
      console.log(`Starting ${self.name}`);

      // Init


      console.log('Resolve');
      resolve();

    });
    return p;
  }

  listen() {
    let self = this;
    let p = new Promise((resolve, reject) => {
      console.log(`Attempt bind on channel ${this.queues}`);
      if(this.queues) {
        this._worker = new QueueWorker(this.queues, {}, this.redis);

        this._worker.on('message', (queue, data) => {
          self.emit(data);
        });

        this._worker.on('error', (err) => {
          self.emit(err);
        });

        this._worker.start();
      }
      resolve();

    });

    return p;

  }

  /**
   * Query for Services that will be of use.
   * @param exitHandlerFactory
   * @param modelRepository
   */
  query(exitHandlerFactory, modelRepository) {
    let self = this;
    if(exitHandlerFactory)
      this._bindCleanUp(exitHandlerFactory, modelRepository);
    // Dispatch Proxy -- init / announce
    this.proxyLib.connect({addr:`http://${this.discoveryHost}:${this.discoveryPort}`}, (err, p) => {
      p.bind({ types: self.types });
      self.proxy = p;
    });
  }

  announce(exitHandlerFactory, modelRepository) {
    this.makeAnnouncement = true; /// Not being set in constructor for some reason @TODO: FIX
    if(this.makeAnnouncement === true) {
      if(exitHandlerFactory)
        this._bindCleanUp(exitHandlerFactory, modelRepository);
    }

    if(this.makeAnnouncement === true) {
      let self = this;
      // Discovery Proxy -- init / announce
      this.getMe().then((me) => {
        console.log(me);
        console.log(`http://${this.discoveryHost}:${this.discoveryPort}`);
        this.proxyLib.connect({addr:`http://${this.discoveryHost}:${this.discoveryPort}`}, (err, p) => {
          p.bind({ descriptor: me, types: self.types });
          self.proxy = p;
        });
      }).catch((err) => {
        console.log(err);
      });
    }
  }

  /**
   * Cleanup handler
   * Perform any necessary cleanup for the server on exit.
   */
  _bindCleanUp(exitHandlerFactory, modelRepository) {
    process.stdin.resume();//so the program will not close instantly

    // Exit handler
    let exitHandler = exitHandlerFactory(this.id, modelRepository);

    //do something when app is closing
    process.on('exit', exitHandler.bind(null,{cleanup:true}));

    //catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, {cleanup:true}));

    //catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, {cleanup:true}));
  }

}

module.exports.Worker = Worker;
