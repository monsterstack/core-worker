'use strict';
const debug = require('debug')('core-worker');
const Promise = require('promise');
const config = require('config');
const QueueWorker = require('redis-queue-worker');
const Node = require('./node').Node;

class Worker extends Node {
  /**
   * Create Worker
   * @param name {String}
   * @param announcement {Object}
   * @param options {Object}
   */
  constructor(name, announcement, options) {
    super();
    this.id = require('node-uuid').v1();
    this.options = options;
    this.name = name;
    this._worker = null;
    this.announcement = announcement;

    this.types = options.typeQuery || [];
    this.redis = options.redis;

    if (this.redis) {
      this.redis.retry_strategy = this.redisRetryStrategy();
    }

    this.proxyLib = require('discovery-proxy');
    this.proxy = null;

    this.discoveryHost = config.discovery.host;
    this.discoveryPort = config.discovery.port;

    if (options) {
      if (options.discoveryHost) {
        this.discoveryHost = options.discoveryHost;
      }

      if (options.discoveryPort) {
        this.discoveryPort = options.discoveryPort;
      }
    }

    let queue = null;

    if (options) {
      debug(options);
      if (options.queue) {
        this.queues = options.queue;
      }
    }
  }

  hasWorker() {
    return this._worker !== null;
  }

  getMe() {
    let descriptor = {
      type: this.name,
      class: 'Worker',
      schemaPath: this.announcement.schemaPath,
      docsPath: this.announcement.docsPath,
      timestamp: new Date(),
      id: this.id,
      region: this.announcement.region,
      stage: this.announcement.stage,
      status: 'Online',
      version: this.announcement.version,
    };

    let p = new Promise((resolve, reject) => {
      descriptor.endpoint = `q://${this.options.queue}`;
      resolve(descriptor);
    });
    return p;

  }

  /**
   * Initialize Worker
   * @returns {Promise}
   */
  init() {
    let _this = this;
    let p = new Promise((resolve, reject) => {
      let initHeaderLog = `Starting ${_this.name}`;
      debug(initHeaderLog);

      // Init

      debug('Resolve');
      resolve();

    });
    return p;
  }

  /**
   * Listen to Message Broker
   * @returns {Promise}
   */
  listen() {
    let _this = this;
    let p = new Promise((resolve, reject) => {
      debug(`Attempt bind on channel ${_this.queues}`);
      if (_this.queues) {
        _this._worker = new QueueWorker(_this.queues, {}, _this.redis);

        _this._worker.on('message', (queue, data) => {
          _this.emit(data);
        });

        _this._worker.on('error', (err) => {
          _this.emit(err);
        });

        _this._worker.start();
      }

      resolve();

    });

    return p;

  }

  /**
   * Query for Services that will be of use.
   * @param exitHandlerFactory
   * @param modelRepository
   * @returns {Void}
   */
  query(exitHandlerFactory, modelRepository) {
    let _this = this;
    if (exitHandlerFactory) {
      _this._bindCleanUp(exitHandlerFactory, modelRepository);
    }

    // Dispatch Proxy -- init / announce
    let addr = `http://${this.discoveryHost}:${this.discoveryPort}`;
    this.proxyLib.connect({ addr: addr }, (err, p) => {
      p.bind({ types: _this.types });
      _this.proxy = p;
    });
  }

  /**
   * Announce
   * @param exitHandler {Object}
   * @param modelRepository {Object}
   * @returns {Void}
   */
  announce(exitHandlerFactory, modelRepository) {
    this.makeAnnouncement = true; /// Not being set in constructor for some reason @TODO: FIX
    if (this.makeAnnouncement === true) {
      if (exitHandlerFactory)
        this._bindCleanUp(exitHandlerFactory, modelRepository);
    }

    if (this.makeAnnouncement === true) {
      let _this = this;

      // Discovery Proxy -- init / announce
      this.getMe().then((me) => {
        console.log(me);
        let addr = `http://${this.discoveryHost}:${this.discoveryPort}`;
        this.proxyLib.connect({ addr: addr }, (err, p) => {
          p.bind({ descriptor: me, types: _this.types });
          _this.proxy = p;
        });
      }).catch((err) => {
        console.log(err);
      });
    }
  }

  /**
   * Cleanup handler
   * Perform any necessary cleanup for the server on exit.
   * @param exitHandler {Object}
   * @param modelRepository {Object}
   * @returns {Void}
   */
  _bindCleanUp(exitHandlerFactory, modelRepository) {
    process.stdin.resume();//so the program will not close instantly

    // Exit handler
    let exitHandler = exitHandlerFactory(this.id, modelRepository);

    //do something when app is closing
    process.on('exit', exitHandler.bind(null, { cleanup: true }));

    //catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, { cleanup: true }));

    //catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, { cleanup: true }));
  }

}

module.exports.Worker = Worker;
