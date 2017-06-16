/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/sampleQueue/sampleQueueOps.js
 */
const expect = require('chai').expect;
// const sampleUpsertUtils = require('../../src/sampleQueue/sampleUpsertUtils');
const configModule = require('../../src/config/config');
const sinon = require('sinon');
const tu = require('../testUtils');
const registry = tu.config.registry;
const refocusUrl = registry[Object.keys(tu.config.registry)[0]].url;
configModule.clearConfig();
configModule.setRegistry(registry);
const sampleQueueOps =  require('../../src/sampleQueue/sampleQueueOps');
const bulkEndPoint = require('../../src/constants').bulkUpsertEndpoint;
const winston = require('winston');
const nock = require('nock');
const mockRest = require('../mockedResponse');
const httpStatus = require('../../src/constants').httpStatus;

describe('test/sampleQueue/sampleQueueOps.js >', () => {
  const samples = [];
  for (let i = 0; i < 10; i++) { // create 10 samples
    samples.push({ name: `sample${i.toString()}`, value: i });
  }

  let winstonInfoStub;
  let winstonErrStub;
  beforeEach(() => {
    winstonInfoStub = sinon.stub(winston, 'info');
    winstonErrStub = sinon.stub(winston, 'error');
  });

  afterEach(() => {
    winstonInfoStub.restore();
    winstonErrStub.restore();
  });
  describe('enqueue >', () => {
    it('enqueue, ok', (done) => {
      sampleQueueOps.enqueue(samples);
      expect(sampleQueueOps.sampleQueue.length).to.be.equal(10);
      expect(sampleQueueOps.sampleQueue[0].name).to.be.equal('sample0');
      expect(sampleQueueOps.sampleQueue[9].name).to.be.equal('sample9');
      expect(winston.info.calledOnce).to.be.true;
      expect(winston.info.calledWith(
        'Enqueue successful for : 10 samples'
      )).to.be.true;
      done();
    });

    it('enqueue, failed', (done) => {
      sampleQueueOps.enqueue([{ abc: 'randomText' }]);
      expect(winston.error.calledOnce).to.be.true;
      expect(winston.error.args[0][0]).contains(
        'Enqueue failed. Error: ValidationError: Invalid sample: ' +
        '{"abc":"randomText"}'
      );
      done();
    });
  });

  describe('test/sampleQueue/sampleQueueOps.js >', () => {
    it('flush, no maxSamplesPerBulkRequest set, ok', (done) => {
      nock(refocusUrl)
        .post(bulkEndPoint, samples)
        .reply(httpStatus.CREATED, mockRest.bulkUpsertPostOk);
      sampleQueueOps.flush();

      setTimeout(() => {
        expect(winston.info.calledOnce).to.be.true;
        expect(winston.info.args[0][0]).contains(
          'sampleQueue flush successful for : 10 samples'
        );
        done();
      }, 500);
    });
  });
});
