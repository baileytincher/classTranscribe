/** Copyright 2015 Board of Trustees of University of Illinois
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var client = require('./../modules/redis');
var fs = require('fs');

var className = process.argv[2];

client.smembers("ClassTranscribe::Finished::" + className, function (err, results) {
  results = results.sort(function (a,b) {
    var aSplit = a.split("_");
    var bSplit = b.split("_");
    return parseInt(aSplit[3]) * 100 + parseInt(a.split("part")[1]) - parseInt(bSplit[3]) * 100 - parseInt(b.split("part")[1]);
  });

  results.forEach(function (videoWithName) {
    var captions = fs.readFileSync("captions/second/" + className + "/" + videoWithName.replace("txt","json"))
    console.log(captions + ",");
  })
})