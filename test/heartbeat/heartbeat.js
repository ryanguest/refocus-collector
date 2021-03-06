/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/heartbeat/heartbeat.js
 */
'use strict'; // eslint-disable-line strict
const nock = require('nock');
const expect = require('chai').expect;
const configModule = require('../../src/config/config');
const heartbeat = require('../../src/heartbeat/heartbeat');
const httpStatus = require('../../src/constants').httpStatus;
const repeater = require('../../src/repeater/repeater');
const sendHeartbeat = heartbeat.sendHeartbeat;

let config;

const generator1 = {
  name: 'Core_Trust1_heartbeat',
  aspects: [{ name: 'A1', timeout: '1m' }],
  generatorTemplateName: 'refocus-trust1-collector',
  subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
  context: { baseUrl: 'https://example.api', },
  collectors: [{ name: 'agent1' }],
  generatorTemplate: {
    name: 'refocus-trust1-collector',
    connection: {
      url: 'https://example.api',
      bulk: true,
    },
  },
  interval: 6000,
};

const generator1Updated = {
  name: 'Core_Trust1_heartbeat',
  aspects: [{ name: 'A1', timeout: '1m' }],
  generatorTemplateName: 'refocus-trust1-collector',
  subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
  context: { baseUrl: 'https://example.api', },
  collectors: [{ name: 'agent1' }],
  generatorTemplate: {
    name: 'refocus-trust1-collector',
    connection: {
      url: 'https://example.api/v2',
      bulk: true,
    },
  },
  interval: 12000,
};

const generator2 = {
  name: 'generator2_heartbeat',
  interval: 6000,
  aspects: [{ name: 'A2', timeout: '1m' }],
  subjects: [{ absolutePath: 'S1.S2', name: 'S2' }],
  generatorTemplate: {
    connection: {
      url: 'http://www.abc.com',
      bulk: false,
    },
  },
};

const generator3 = {
  name: 'generator3_heartbeat',
  interval: 6000,
  aspects: [{ name: 'A3', timeout: '1m' }],
  subjects: [{ absolutePath: 'S1.S2', name: 'S2' }],
  generatorTemplate: {
    connection: {
      url: 'http://www.abc.com',
      bulk: false,
    },
  },
};

const errorResponse = {
  error: 'Forbidden error with heartbeat',
};

const hbResponseNoSG = {
  collectorConfig: {
    heartbeatInterval: 50,
    maxSamplesPerBulkRequest: 10,
    sampleUpsertQueueTime: 100,
  },
  generatorsAdded: [],
  generatorsUpdated: [],
  generatorsDeleted: [],
};

const hbResponseWithSG = {
  collectorConfig: {
    heartbeatInterval: 20,
    maxSamplesPerBulkRequest: 100,
  },
  generatorsAdded: [
    generator1,
  ],
  generatorsUpdated: [],
  generatorsDeleted: [],
};

const hbResponseWithSGToDelete = {
  collectorConfig: {
    heartbeatInterval: 99,
    maxSamplesPerBulkRequest: 999,
  },
  generatorsAdded: [
  ],
  generatorsUpdated: [],
  generatorsDeleted: [
    generator1,
    generator2,
    generator3,
  ],
};

const hbResponseWithSGToUpdate = {
  collectorConfig: {
    heartbeatInterval: 120,
    maxSamplesPerBulkRequest: 7000,
  },
  generatorsAdded: [
    generator2,
    generator3,
  ],
  generatorsUpdated: [
    generator1Updated,
  ],
  generatorsDeleted: [],
};

describe('test/heartbeat/heartbeat.js >', () => {
  const refocusUrl = 'http://refocusheartbeatmock.com';
  const collectorName = 'collectorForHeartbeatTests';
  const heartbeatEndpoint = `/v1/collectors/${collectorName}/heartbeat`;
  const collectorToken = 'm0ck3dt0k3n';

  before((done) => {
    configModule.clearConfig();
    configModule.initializeConfig();
    config = configModule.getConfig();
    config.name = collectorName;
    config.refocus.url = refocusUrl;
    config.refocus.accessToken = collectorToken;
    repeater.stopAllRepeat();
    done();
  });

  after((done) => {
    configModule.clearConfig();
    done();
  });

  afterEach(() => {
    repeater.stopAllRepeat();
  });

  it('error from heartbeat response', (done) => {
    nock(refocusUrl, {
      reqheaders: { authorization: collectorToken },
    })
    .post(heartbeatEndpoint)
    .reply(httpStatus.FORBIDDEN, errorResponse);

    sendHeartbeat()
    .then((err) => {
      expect(err.response.status).to.equal(httpStatus.FORBIDDEN);
      expect(err.response.body).deep
        .equal({ error: 'Forbidden error with heartbeat' });
      done();
    }).catch((err) => done(err));
  });

  it('Ok, simple response without generators', (done) => {
    nock(refocusUrl, {
      reqheaders: { authorization: collectorToken },
    })
    .post(heartbeatEndpoint)
    .reply(httpStatus.OK, hbResponseNoSG);

    sendHeartbeat()
    .then((res) => {
      expect(res).to.have.all.keys('refocus', 'generators', 'metadata', 'name');
      expect(res.generators).to.deep.equal({});
      expect(res.refocus).to.include(hbResponseNoSG.collectorConfig);
      done();
    }).catch((err) => done(err));
  });

  it('Ok, handle a complete response with generators', (done) => {
    nock(refocusUrl, {
      reqheaders: { authorization: collectorToken },
    })
    .post(heartbeatEndpoint)
    .reply(httpStatus.OK, hbResponseWithSG);

    sendHeartbeat()
    .then((res) => {
      expect(res).to.have.all.keys('refocus', 'generators', 'metadata', 'name');
      expect(res.refocus).to.include(hbResponseWithSG.collectorConfig);
      expect(res.generators).to.deep.equal({ [generator1.name]: generator1 });
      done();
    }).catch((err) => done(err));
  });

  it('Ok, sendheart end-to-end', (done) => {
    nock(refocusUrl, {
      reqheaders: { authorization: collectorToken },
    })
    .post(heartbeatEndpoint)
    .reply(httpStatus.OK, hbResponseWithSG);

    // send heartbeat to get a response to add generator1
    sendHeartbeat()
    .then(() => {
      nock(refocusUrl, {
        reqheaders: { authorization: collectorToken },
      })
      .post(heartbeatEndpoint)
      .reply(httpStatus.OK, hbResponseWithSGToUpdate);

      /*
       * send heartbeat to get a response to add generator2, generator3
       * and update generator1
       */
      return sendHeartbeat();
    })
    .then((res) => {
      expect(res).to.have.all.keys('refocus', 'generators', 'metadata', 'name');
      expect(res.refocus).to.include(hbResponseWithSGToUpdate.collectorConfig);

      // make sure the generator1 is updated
      expect(res.generators[generator1.name].generatorTemplate).to.deep.equal(
        generator1Updated.generatorTemplate);

      // make sure generator2 and generator 3 are added
      expect(res.generators[generator2.name]).to.deep.equal(generator2);
      expect(res.generators[generator3.name]).to.deep.equal(generator3);
      nock(refocusUrl, {
        reqheaders: { authorization: collectorToken },
      })
      .post(heartbeatEndpoint)
      .reply(httpStatus.OK, hbResponseWithSGToDelete);

      // send another heartbeat to get a response to delete all the generators
      return sendHeartbeat();
    })
    .then((res) => {
      expect(res).to.have.all.keys('refocus', 'generators', 'metadata', 'name');
      expect(res.generators).to.deep.equal({});
      expect(res.refocus).to.include(hbResponseWithSGToDelete.collectorConfig);
      done();
    })
    .catch((err) => done(err));
  });
});
