/*-------------------- MODULES --------------------*/
var request = require('request');
var cheerio = require('cheerio');
var jf = require('jsonfile');
var MongoClient = require('mongodb').MongoClient;
var _ = require('underscore');
var google = require('googleapis');
/*-------------------------------------------------*/

// 1. Define service
var service = 'images';
var google_language_code = 'pt-BR';
var bing_language_code = 'pt-BR';
var uniqueRecords = {};

// 2. Read all records
// var originalRecords = jf.readFileSync('data/' + service + '.json');
// console.log(originalRecords);
// console.log('Original records: ' + originalRecords.length);

MongoClient.connect('mongodb://127.0.0.1:27017/thesis', function(err, db) {
    
    console.log('Connecting to DB...');
    
    if(err) throw err;
    
    console.log('Connected.');

    var recordsCollection = db.collection('records');

    recordsCollection.find({
        'language_code': google_language_code,
        'service': service
    }).toArray(function(err, results) {

        console.log('Found ' + results.length + ' total results.');
        filterUniqueRecords(results, db);

    });
});

// 3. Create list of unique ones
function filterUniqueRecords(originalRecords, db){

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

    checkAlreadySaved(db);  
}

// 4. Search for records already stored in the db
function checkAlreadySaved(db){
        
    var collection = db.collection(service);

    collection.find({}).toArray(function(err, results) {
        // console.dir(results);
        console.log('Found ' + results.length + ' results already saved.');

        // A) Reduce results to a simple list of queries
        results = _.map(results, function(item, index, list){
            return item['query'];
        });
        // console.log(results);

        // B) Filter out queries in db from the uniqueRecords collection
        uniqueRecords = _.omit(uniqueRecords, function(value, key, collection){
            return results.indexOf(key) > -1; 
        });
        // console.log(Object.keys(uniqueRecords).length);
        // console.log(uniqueRecords);

        // C) Turn the collection into an array,
        // so we can keep track of the iterations
        uniqueRecords = _.map(uniqueRecords, function(value, key, collection){
            return {
                query: key,
                language_code: value['language_code']
            }
        });
        // console.log(uniqueRecords);
        console.log('Reduced unique records to ' + uniqueRecords.length);

        // D) Search
        if(service == 'youtube'){
            searchYoutube(0, db, collection);
        }else if(service == 'images'){
            searchImages(0, db, collection);
        }
    });
}


/*-------------------- IMAGES --------------------*/
// 5A. Search Images
 
var searchImages = function(i, db, collection){

    var query = uniqueRecords[i]['query'];
    while(query.indexOf(' ') > -1){
        query = query.replace(' ', '+') 
    }
    var market = bing_language_code;
    var adult = 'Off';
    var AppId = 'cZOFS5HD5kC6Mwq+VgLuv96ta9qU7hhRTrw2YS8R51k';
    var encodedAppKey = new Buffer(AppId).toString('base64');

    // console.log('Called searchImages for ' + query);

    var requestStr = 'https://user:' + AppId + '@api.datamarket.azure.com/Bing/Search/Image?'
        
            // Common request fields (required)
            + 'Query=%27' + query + '%27'            
            + '&Market=%27' + market + '%27'
            + '&Adult=%27' + adult + '%27'
            + '&$top=10'
            + '&$format=JSON';


    request(requestStr, function(error, response, body){
        // console.log(body);
        var body = JSON.parse(body);
        var results = body['d']['results'];
        // console.log(results);

        var maxDimension = 0;
        var index = 0;
        for(var j = 0; j < results.length; j++){
            if(results[j]['Width'] * results[j]['Height'] > maxDimension &&
               results[j]['MediaUrl'].indexOf('wp-content') < 0){
                maxDimension = results[j]['Width'] * results[j]['Height'];
                index = j;
            }
        }
        // console.log(results[index]);
        var record = {
            query: uniqueRecords[i]['query'],
            url: results[index]['MediaUrl']
        }
        console.log(record);
        saveToMongoDB(record, i, db, collection);

    });
}

// SCRAPER
// // console.log(link);
// var searchImages = function(i, db, collection){

//     var query = uniqueRecords[i]['query'];
//     console.log('Called searchImages for ' + query);

//     var baseUrl = 'https://www.google.com/search?site=imghp&tbm=isch&q=X';

//     var link = baseUrl.replace('X', query);
//     link += "&hl=" + uniqueRecords[i]['language_code'];
//     while(link.indexOf(' ') > -1){
//         link = link.replace(' ', '+') 
//     }

//     request(link, function(error, response, html){
//         if(!error){
//             var $ = cheerio.load(html);
//             // var content = $('body').text();
//             var results = $('img');
//             var imgSrc = $(results[1]).attr('src');
//             // console.log(imgSrc);
//             var record = {
//                 query: query,
//                 thumbnail: imgSrc
//             }
//             saveToMongoDB(record, i, db, collection);
//         }
//     });
// }
	


/*-------------------- YOUTUBE -------------------*/
// 5B. Search Youtube
var searchYoutube = function(i, db, collection){
    
    var query = uniqueRecords[i]['query'];
    console.log('Called searchYoutube for ' + query + ', ' + uniqueRecords[i]['language_code']);

    var youtube = google.youtube('v3');
    var API_KEY = 'AIzaSyBIYs4yJNHOxI-kk_x-wIoGHWRyFUoil9M';

    youtube.search.list({
        auth: API_KEY,
        q: query,
        part: 'snippet',
        relevanceLanguage: uniqueRecords[i]['language_code']
    }, function(err, response){
        if(err){
            throw err;
        }else{
            // console.log(response);
            // console.log(JSON.stringify(response['items'][1]));

            for(var j = 0; j < response['items'].length; j++){
                console.log(j);
                if(response['items'][j]['id']['kind'] == 'youtube#video'){
                    var record = {
                        query: query,
                        videoId: response['items'][j]['id']['videoId'],
                        thumbnail: response['items'][j]['snippet']['thumbnails']['high']['url']
                    }
                    saveToMongoDB(record, i, db, collection);
                    break;
                }  
            }
        }
    });
}

// 6. Save to MongoDB
function saveToMongoDB(record, i, db, collection){

    console.log('Saving data to mongoDB.')

    collection.insert(record, function(err, docs) {
        if(err){
            throw err;
        }else{
            console.log('Obj succesfully saved to DB.');    
            // Next iteration
            if(i < uniqueRecords.length - 1){
                console.log('Calling next iteration.');
                // Wait a bit so we don't break Google's API limits
                setTimeout(function(){
                    i ++;
                    if(service == 'youtube'){
                        searchYoutube(i, db, collection);    
                    }else if(service == 'images'){
                        console.log('Selected service is ' + service);
                        searchImages(i, db, collection);
                    }
                }, 1000);
            }else{
                db.close();         // close database                  
            }                   
        }
    });
}