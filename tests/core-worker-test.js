'use strict';
const Worker = require('../libs/worker.js').Worker;

describe('core-worker-test', () => {
  let worker;
  before((done) => {
    let announcement = {
      name: 'MyWorker',
    };

    worker = new Worker(announcement.name, announcement, { queue: 'fooQueue' });

    worker.init().then(() => {
      worker.listen().then(() => {
        done();
      }).catch((err) => {
        done(err);
      });
    }).catch((err) => {
      done(err);
    });
  });

  it('Expect Worker to exist', (done) => {
    if (worker.hasWorker()) {
      done();
    } else {
      done(new Error('Expected Worker to Exist'));
    }
  });

  after((done) => {
    done();
  });
});
