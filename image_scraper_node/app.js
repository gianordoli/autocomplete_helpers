var http = require('http');
var request = require('request');
var cheerio = require('cheerio');
var jf = require('jsonfile');

var imagesFiles = jf.readFileSync('data/youtube.json');
// console.log(imagesFiles);
console.log('Original records: ' + imagesFiles.length);

var images = {};
imagesFiles.forEach(function(item, index, list){
    // console.log(item['query']);
    var query = item['query'];
    // If the item is not in the collection yet...
    if(images[query] === undefined){
        images[query] = {
        	language_code: item['language_code'],
        	url: ''
        };
    }
    // console.log(query + ', ' + item['language_name']);
});
// console.log(images);
console.log('Unique records: ' + Object.keys(images).length);

// var query = 'x stitch patterns tractor';

// var baseUrl = 'https://www.google.com/search?site=imghp&tbm=isch&q=X';

// var link = baseUrl.replace('X', query);
// link += "&hl=" + images[query]['language_code'];
// while(link.indexOf(' ') > -1){
// 	link = link.replace(' ', '+') 
// }

// console.log(link);

// var server = http.createServer(function(req, res) {
// 
// 	request(link, function(error, response, html){
// 	    if(!error){
// 	        var $ = cheerio.load(html);
// 	        // var content = $('body').text();
// 	        var results = $('img');
// 	        // results[1];
// 	        for(var i = 0; i < images.length; i++){
// 	        	console.log(i);
// 	        	console.log($(images[i]).attr('src'));
// 	        }
// 	        // res.end(content);
// 	    }
// 	});
// 
// });

var google = require('googleapis');
var youtube = google.youtube('v3');
var API_KEY = 'AIzaSyBIYs4yJNHOxI-kk_x-wIoGHWRyFUoil9M';

youtube.search.list({
	auth: API_KEY,
    q: 'anitta',
    part: 'snippet'
}, function(err, response){
	console.log(err);
	console.log(response);
});

// server.listen(3000, function() {
// 	console.log('--> server listening to port: ' + 3000);
// });