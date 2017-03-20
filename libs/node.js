'use strict';
const debug = require('debug')('core-worker');
const EventEmitter = require('events');

/**
 * Base Node
 */
class Node extends EventEmitter {
    /**
     * Create Node
     */
    constructor() {
        super();
    }

    /**
     * Redis Retry strategy
     * @returns {Function} - Retry Strategy
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