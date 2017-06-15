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
const sampleQueue = [];

/**
 * [enqueue description]
 * @param  {[type]} samples [description]
 * @return {[type]}         [description]
 */
function enqueue(samples) {
  try {
    samples.forEach((sample) => {
      sampleQueue.push(sample);
    });
    logger.info(`Enqueue successful for : ${samples.length} samples`);
  } catch (err) {
    logger.info(`Enqueue failed. Error: ${err}`);
  }
}
