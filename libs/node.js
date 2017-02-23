'use strict';
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
            console.log(options);
            // reconnect after
            return Math.min(options.attempt * 100, 3000);
        }
    }
}

module.exports.Node = Node;