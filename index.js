'use strict';
const glob = require('glob');
const Promise = require('promise');
const config = require('config');
const appRoot = require('app-root-path');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const QueueWorker = require('redis-queue-worker');

class Worker extends EventEmitter {
  constructor(name, options) {
    super();
    this.id = require('node-uuid').v1();
    this.name = name;

    this.redis = options.redis;

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

}

module.exports.Worker = Worker;
