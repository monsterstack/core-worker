'use strict';
const Promise = require('promise');
const QueueWorker = require('redis-queue-worker');
const EventEmitter = require('events').EventEmitter;


class Worker extends EventEmitter {
  constructor(name, options) {
    super();
    this.id = require('node-uuid').v1();
    this.name = name;

    this.types = options.typeQuery || [];
    this.redis = options.redis;

    this.proxyLib = require('discovery-proxy');
    this.proxy = null;

    let queue = null;

    if(options) {
      console.log(options);
      if(options.queue) {
        this.queues = options.queue;
      }
    }
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
