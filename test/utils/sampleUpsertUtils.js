/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/utils/sampleUpsertUtils.js
 */
const expect = require('chai').expect;
const sampleUpsertUtils = require('../../src/utils/sampleUpsertUtils');
const request = require('superagent');
const mock = require('superagent-mocker')(request);

describe('test/utils/sampleUpsertUtils.js >', () => {
  const dummyStr = 'http://dummy.refocus.url';
  const dummyToken = '3245678754323356475654356758675435647qwertyrytu';
  const properRegistryObject = { url: dummyStr, token: dummyToken };
  const sampleArr = [{ name: 'sample1' }, { name: 'sample2' }];

  describe('doBulkUpsert tests', () => {

    // clear stub
    after(mock.clearRoutes);

    it('no url in registry object, gives validation error', (done) => {
      sampleUpsertUtils.doBulkUpsert({ token: 'dummy' }, [])
      .then(() => done(new Error('Expected validation error')))
      .catch((err) => {
        expect(err.name).to.equal('ValidationError');
        expect(err.status).to.equal(400);
        done();
      });
    });

    it('no array input gives validation error', (done) => {
      sampleUpsertUtils.doBulkUpsert(properRegistryObject)
      .then(() => done(new Error('Expected validation error')))
      .catch((err) => {
        expect(err.name).to.equal('ValidationError');
        expect(err.status).to.equal(400);
        done();
      });
    });

    it('no token in registry object, gives validation error', (done) => {
      sampleUpsertUtils.doBulkUpsert(properRegistryObject)
      .then(() => done(new Error('Expected validation error')))
      .catch((err) => {
        expect(err.name).to.equal('ValidationError');
        expect(err.status).to.equal(400);
        done();
      });
    });

    it('empty array is ok', (done) => {

      // set up stub
      mock.post(properRegistryObject.url + '/v1/samples/upsert/bulk', () => Promise.resolve());
      sampleUpsertUtils.doBulkUpsert(properRegistryObject, [])
      .then((object) => {
        expect(object.status).to.equal(200);
        done();
      })
      .catch(done);
    });

    it('array of samples is returned', (done) => {

      // set up stub to return the request
      mock.post(properRegistryObject.url + '/v1/samples/upsert/bulk',
        (req) => req);
      sampleUpsertUtils.doBulkUpsert(properRegistryObject, sampleArr)
      .then((object) => {

        // due to how superagent-mocker works,
        // request.body is sent and returned as
        // { '0': { name: 'sample1' }, '1': { name: 'sample2' } }
        // instead of an array
        expect(object.body['0']).to.deep.equal(sampleArr[0]);
        expect(object.body['1']).to.deep.equal(sampleArr[1]);
        expect(object.status).to.equal(200);
        done();
      })
      .catch(done);
    });
  });
});
