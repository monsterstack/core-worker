'use strict';

const config = require('config');
const optimist = require('optimist');
const main = () => {

  // Handle Arguments
  let Worker = require('./index').Worker;
  let worker = new Worker("SampleWorker", {
    queue: config.channel,
    redis: config.redis
  });

  /** Init and handle lifecycle **/
  worker.init().then(() => {

    worker.listen().then(() => {
      console.log('Running"');

      server.on('message', (data) => {
        // Handle Work
      });

      server.on('error', (err) => {
        // Handle Errors
      });
    });
  });
}


if(require.main === module) {
  main();
}
