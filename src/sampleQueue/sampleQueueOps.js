/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * /src/sampleQueue/sampleQueue.js
 */
const logger = require('winston');
const config = require('../config/config').getConfig();
const doBulkUpsert = require('./sampleUpsertUtils').doBulkUpsert;
const errors = require('../errors/errors');
const sampleQueue = [];

/**
 * [enqueue description]
 * @param  {[type]} samples [description]
 * @return {[type]}         [description]
 */
function enqueue(samples) {
  try {
    samples.forEach((sample) => {
      if (typeof sample !== 'object' || typeof sample.name !== 'string') {
        throw new errors.ValidationError(
          `Invalid sample: ${JSON.stringify(sample)}`
        );
      }

      sampleQueue.push(sample);
    });
    logger.info(`Enqueue successful for : ${samples.length} samples`);
  } catch (err) {
    logger.error(`Enqueue failed. Error: ${err}`);
  }
}

/**
 * [bulkUpsertAndLog description]
 * @param  {[type]} samples [description]
 * @return {[type]}         [description]
 */
function bulkUpsertAndLog(samples) {
  if (!config || !config.registry ||
   Object.keys(config.registry).length === 0) {
    throw new errors.ValidationError(
      `Registry empty or not found. Config: ${JSON.stringify(config)}`
    );
  }

  doBulkUpsert(config.registry[Object.keys(config.registry)[0]], samples)
  .then(() => {
    logger.info(`sampleQueue flush successful for : ${samples.length} samples`);
  })
  .catch((err) => {
    logger.info(
      `sampleQueue flush failed for : ${samples.length} samples.` +
      `Error: ${JSON.stringify(err)}`);
  });
}

/**
 * [flush description]
 * @return {[type]} [description]
 */
function flush() {
  let maxSamplesCnt;
  if (config.hasOwnProperty('maxSamplesPerBulkRequest')) {
    maxSamplesCnt = config.maxSamplesPerBulkRequest;
  }

  let samples = sampleQueue;
  if (maxSamplesCnt) {
    const totSamplesCnt = sampleQueue.length;

    let startIdx = 0;
    while ((startIdx + maxSamplesCnt) < totSamplesCnt) {
      const endIdx = startIdx + maxSamplesCnt;
      samples = sampleQueue.slice(startIdx, endIdx);
      bulkUpsertAndLog(samples);
      startIdx = endIdx;
    }

    samples = sampleQueue.slice(startIdx, totSamplesCnt);
  }

  bulkUpsertAndLog(samples);
}

module.exports = {
  enqueue,
  flush,
  sampleQueue, // for testing purposes
};
