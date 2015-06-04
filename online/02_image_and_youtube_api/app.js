/*-------------------- MODULES --------------------*/
var request = require('request');
var cheerio = require('cheerio');
var jf = require('jsonfile');
var MongoClient = require('mongodb').MongoClient;
var _ = require('underscore');
var google = require('googleapis');
var prettyjson = require('prettyjson');
/*-------------------------------------------------*/

// 1. Define service
var service = 'images';
var google_language_code = 'vi';
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

    var exceptions = ['blogspot', 'ytimg'];

    var query = uniqueRecords[i]['query'];
    console.log('Called searchImages for ' + query + ', ' + uniqueRecords[i]['language_code']);

    var customsearch = google.customsearch('v1');

    var CX = '009093787028265469982:75wos-7sdjk';    // google
    // var CX = '009093787028265469982:47qrsohgctc';    // google+
    // var CX = '009093787028265469982:7xuqjmbnfu0';    // google++

    // var API_KEY = 'AIzaSyBtYYmAh0x8o8PthznzyCnhQRYJS5d0nx8'; // images    
    // var API_KEY = 'AIzaSyAAPIV1--iOaKX_D3tYMdz-sCOI6LafJfek3o'; // custom search
    // var API_KEY = 'AIzaSyC80HCh8DKlu9x7sHjOV5nsAbC1IEVP7OE'; // images 2
    // var API_KEY = 'AIzaSyBCoxd-Rx9R4xvpQE1clX6OcQuUxK8uiYc'; // My Project
    // var API_KEY = 'AIzaSyB21SQBr7a2lJ-HQmHDr25pYrT_tKYfVqY'; // Images 3
    var API_KEY = 'AIzaSyCCSEOBYuxqIDGkCzYWu-onqLMpkQoFOUA'; // Images 4
    // var API_KEY = 'AIzaSyBTUd10AwprTZdDDJF2vK1EcAKBTTdbaEE'; // Images 4    

    /*-------------------- DEBUG --------------------*/
    // var resp = {};
    // resp['items'] = [];
    // resp.items.push({'link': 'http://www.i.ytimg.com.com'});    
    // resp.items.push({'link': 'http://www.blogspot.com'});
    // resp.items.push({'link': 'http://www.laura.com'});
    // console.log(resp.items);
    /*-----------------------------------------------*/

    customsearch.cse.list({
            cx: CX,
            q: query,
            auth: API_KEY,
            searchType: 'image',
            imgSize: 'medium',
            hl: uniqueRecords[i]['language_code'],
            filter: 1       // Turns on duplicate content filter
            // relevanceLanguage: uniqueRecords[i]['language_code']
        }, function(err, resp) {
        if (err) {
            console.log('An error occured', err);
            return;
        }
        // Got the response from custom search
        console.log('Result: ' + resp.searchInformation.formattedTotalResults);
        
        if (resp.items && resp.items.length > 0) {
            // console.log(JSON.stringify(resp.items));
            // console.log('First result name is ' + resp.items[0].title);
        
            var j = 0;
            var isBlocked = true;
            while(isBlocked && j < resp.items.length - 1){
                // Loop through all exceptions
                for(var k = 0; k < exceptions.length; k++){
                    console.log('Checking exception ' + (k+1) + '/' + exceptions.length);
                    if(resp.items[j]['link'].indexOf(exceptions[k]) > -1){
                        console.log('Found exception at ' + resp.items[j]['link']);
                        isBlocked = true;
                        j++;                    
                        break;
                    }else{
                        isBlocked = false;
                    }
                }
            }

            console.log('Select result #' + j);
            var record = {
                query: uniqueRecords[i]['query'],
                url: resp.items[j]['link']
            }
            console.log(record);
            saveToMongoDB(record, i, db, collection);
        }
    });

}


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
            // console.log(prettyjson.render(response));
            // console.log(response['items'].length);

            // We rather store youtube videos than playlists
            //  Loop through the results until you find one
            var j = 0;
            while(j < response['items'].length - 1 &&
                  response['items'][j]['id']['kind'] != 'youtube#video'){
                  j++;
                  console.log('Trying result #' + j);
            }

            // If the results were all playlists,
            // the last one will be stored anyway
            var record = {
                query: query,
                videoId: response['items'][j]['id']['videoId'],
                thumbnail: response['items'][j]['snippet']['thumbnails']['high']['url']
            }
            saveToMongoDB(record, i, db, collection);
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
            console.log(i + '/' + uniqueRecords.length);
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