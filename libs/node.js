'use strict';
const debug = require('debug')('core-worker');
const EventEmitter = require('events');

class Node extends EventEmitter {

    constructor() {
        super();
    }

    /**
     * Redis Retry strategy
     */
    redisRetryStrategy() {
        return (options) => {
            debug(options);
            // reconnect after
            return Math.min(options.attempt * 100, 3000);
        }
    }
}

module.exports.Node = Node;