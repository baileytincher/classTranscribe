const fs = require('fs');
const client_api = require('../../db/db');

const watchLectureVideosPage = fs.readFileSync(mustachePath + 'watchLectureVideos.mustache').toString();

router.get('/watchLectureVideos', function (request, response) {
  // console.log("Got ROUTE", watchLectureVideosPage)
  console.log(request.session['currentContent']);
  response.writeHead(200, {
    'Content-Type': 'text/html'
  });
  var courseOfferingId = request.session['currentContent'][0]['courseOfferingId'];
  console.log(courseOfferingId);
  client_api.getPlaylistByCourseOfferingId(courseOfferingId).then(values => {
    // console.log("-----------------------------")
    // console.log(values)
    // console.log("-----------------------------")
    var playlist = values.map(result => {
      var video = {}
      des = JSON.parse(JSON.stringify(result.siteSpecificJSON))
      video['name'] = des['title']
      video['sources'] = [{src: result['videoLocalLocation'], type:'video/mp4'}]
      video['textTracks'] = [{src: result['srtFileLocation'], srclang: 'eng', label: 'English'}]
      video['thumbnail'] = false
      return video
    });
    console.log("-----------------------------")
    console.log(playlist)
    console.log("-----------------------------")
    renderWithPartial(watchLectureVideosPage, request, response, {playlist : JSON.stringify(playlist)});
  });

  // var playlist = [{
  //     name: 'Dog',
  //     sources: [
  //       { src: 'https://samplestoragect.blob.core.windows.net/samplestorage/sample1.mp4', type: 'video/mp4' }
  //     ],
  //     textTracks: [{
  //       src: 'vtt/sample1.vtt',
  //       srclang: 'fr',
  //       label: 'France'
  //     }],
  //     thumbnail: false
  //   }, {
  //     name: 'Sample 2',
  //     sources: [
  //       { src: 'https://samplestoragect.blob.core.windows.net/samplestorage/sample2.mp4', type: 'video/mp4' }
  //     ],
  //     textTracks: [{
  //       src: 'vtt/sample2.vtt',
  //       srclang: 'fr',
  //       label: 'France'
  //     }],
  //     thumbnail: false
  //   }, {
  //     name: 'Sample 1',
  //     sources: [
  //       { src: 'https://samplestoragect.blob.core.windows.net/samplestorage/sample1.mp4', type: 'video/mp4' }
  //     ],
  //     textTracks: [{
  //       src: 'https://samplestoragect.blob.core.windows.net/samplestorage/sample1.vtt',
  //       srclang: 'fr',
  //       label: 'France'
  //     }],
  //     thumbnail: false
  //   }, {
  //     name: 'Sample 2',
  //     sources: [
  //       { src: 'https://samplestoragect.blob.core.windows.net/samplestorage/sample2.mp4', type: 'video/mp4' }
  //     ],
  //     textTracks: [{
  //       src: 'https://samplestoragect.blob.core.windows.net/samplestorage/sample2.vtt',
  //       srclang: 'fr',
  //       label: 'France'
  //     }],
  //     thumbnail: false
  //   }, {
  //     name: 'Sample 1',
  //     sources: [
  //       { src: 'https://samplestoragect.blob.core.windows.net/samplestorage/sample1.mp4', type: 'video/mp4' }
  //     ],
  //     textTracks: [{
  //       src: 'https://samplestoragect.blob.core.windows.net/samplestorage/sample1.vtt',
  //       srclang: 'fr',
  //       label: 'France'
  //     }],
  //     thumbnail: false
  //   }, {
  //     name: 'Sample 2',
  //     sources: [
  //       { src: 'https://samplestoragect.blob.core.windows.net/samplestorage/sample2.mp4', type: 'video/mp4' }
  //     ],
  //     textTracks: [{
  //       src: 'https://samplestoragect.blob.core.windows.net/samplestorage/sample2.vtt',
  //       srclang: 'fr',
  //       label: 'France'
  //     }],
  //     thumbnail: false
  //   }]
  

  // renderWithPartial(watchLectureVideosPage, request, response, {playlist : JSON.stringify(playlist)});
});

router.get('/getVideo', function(request, response) {
  var lectureNumber = "1";
  var file = path.join(__dirname, "../../videos/Lecture_" + lectureNumber + ".mp4");
  console.log(file);

  fs.stat(file, function handle(err, stats) {
    if (err) {
      if (err.code === "ENOENT") {
        response.send("File doesn't exist");
      }
      else {
        response.send("Something unfathomable happened");
      }
    }
    else {
      var range = request.headers.range;
      var positions = range.replace(/bytes=/, "").split("-");
      var start = parseInt(positions[0], 10);

      fs.stat(file, function (err, stats) {
        var total = stats.size;
        var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        var chunksize = (end - start) + 1;

        response.writeHead(206, {
          "Content-Range": "bytes " + start + "-" + end + "/" + total,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": "video/mp4"
        });

        var stream = fs.createReadStream(file, { start: start, end: end })
          .on("open", function () {
            stream.pipe(response);
          }).on("error", function (err) {
            response.end(err);
          });
      });
    }
  });
});

module.exports = router;
