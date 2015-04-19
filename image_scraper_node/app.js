/*-------------------- MODULES --------------------*/
var request = require('request');
var cheerio = require('cheerio');
var jf = require('jsonfile');
var MongoClient = require('mongodb').MongoClient;
var _ = require('underscore');
/*-------------------------------------------------*/

// 1. Define service
var service = 'youtube';

// 2. Read all records
var originalRecords = jf.readFileSync('data/' + service + '.json');
// console.log(originalRecords);
console.log('Original records: ' + originalRecords.length);

// 3. Create list of unique ones
var uniqueRecords = {};
originalRecords.forEach(function(item, index, list){
    // console.log(item['query']);
    var query = item['query'];
    // If the item is not in the collection yet...
    if(uniqueRecords[query] === undefined){
        uniqueRecords[query] = {
        	language_code: item['language_code']
        };
    }
    // console.log(query + ', ' + item['language_name']);
});
// console.log(uniqueRecords);
console.log('Unique records: ' + Object.keys(uniqueRecords).length);

// 4. Search for records already stored in the db
MongoClient.connect('mongodb://127.0.0.1:27017/autocomplete', function(err, db) {
        console.log('Connecting to DB...');
        if(err) throw err;
        console.log('Connected.');
        var collection = db.collection(service);

        collection.find({}).toArray(function(err, results) {
            console.dir(results);

            // Reduce results to a simple list of queries
            results = _.map(results, function(item, index, list){
                return item['query'];
            });
            // console.log(results);

            // Filter out queries in db from the uniqueRecords collection
            uniqueRecords = _.omit(uniqueRecords, function(value, key, collection){
                return results.indexOf(key) > -1; 
            });
            console.log(Object.keys(uniqueRecords).length);
            // console.log(uniqueRecords);

            // Search
            // searchYoutube(uniqueRecords[0])

            db.close(); // Let's close the db 
        });         
});


// var query = 'x stitch patterns tractor';

// var baseUrl = 'https://www.google.com/search?site=imghp&tbm=isch&q=X';

// var link = baseUrl.replace('X', query);
// link += "&hl=" + images[query]['language_code'];
// while(link.indexOf(' ') > -1){
// 	link = link.replace(' ', '+') 
// }

// console.log(link);

/*-------------------- IMAGES --------------------*/
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


/*-------------------- YOUTUBE -------------------*/
var google = require('googleapis');
var youtube = google.youtube('v3');
var API_KEY = 'AIzaSyBIYs4yJNHOxI-kk_x-wIoGHWRyFUoil9M';

var searchYoutube = function(query){
    youtube.search.list({
        auth: API_KEY,
        q: 'anitta',
        part: 'snippet'
    }, function(err, response){
        console.log(err);
        console.log(response);
        // console.log(JSON.stringify(response['items'][1]));

        for(var i = 0; i < response['items'].length; i++){
            console.log(i);
            if(response['items'][i]['id']['kind'] == 'youtube#video'){
                var record = {
                    query: query,
                    videoId: response['items'][i]['id']['videoId'],
                    thumbnail: response['items'][i]['snippet']['thumbnails']['high']['url']
                }
                break;
            }  
        }
    });
}

// searchYoutube('anitta');