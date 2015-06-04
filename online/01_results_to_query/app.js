/*-------------------- MODULES --------------------*/
var	MongoClient = require('mongodb').MongoClient, // Access database
			 jf = require('jsonfile'),			  // Read json files
			  _ = require('underscore');		  // Filtering/sorting

/*-------------------- SETUP --------------------*/
var loadedCountries, loadedServices;

var init = function(){

	// getDateRangeDB(function(range){
	// 	console.log('Got date range.');
	// 	console.log(range);	// Full db range

		var service = 'web';

		getDomainsByService(service, function(domains){
			console.log('Filtered domains:');
			console.log(domains);
			var params = {
				// 'date': {'$gt': new Date(range[0]), '$lte': new Date(range[1])},
				'service': service,
				'domain': {'$in': domains}
			}
			searchMongoDB(params, function(records){
				console.log('Got results from DB.');
				console.log(records.length);

	    		var newRecords = [];
	    		var filename = 'db/' + service + '.json';

	    		for(var i = 0; i < records.length; i++){

	    			for(var j = 0; j < records[i].results.length; j++){

	    				// Fixing Turkish characters
		    			var query = records[i].results[j];
		    			if(records[i].language == 'tr'){
		    				query = fixTurkishCharacters(query);
		    			}

	    				// console.log(records[i].results[j]);
						var obj = {
							letter:  records[i].letter,
							query: query,
							ranking: j,
						    language_code: records[i].language,
						    language_name: getLanguageName(records[i].language),
						    service: service,
							date: records[i].date
						}
						// console.log(obj);
						newRecords.push(obj);
	    			}
	    		}
	    		console.log(newRecords);

				MongoClient.connect('mongodb://127.0.0.1:27017/thesis', function(err, db) {
					console.log('Connecting to DB...');
					if(err) throw err;
					console.log('Connected.');
					var collection = db.collection('records');

	    			saveToDB(newRecords, 0, db, collection);
	    		});

				// jf.writeFile(filename, newRecords, function(err) {
				// 	if(err) throw err;
				// 	console.log('records succesfully saved to JSON file.');
				// });


			});	
		});
	// });
}

var fixTurkishCharacters = function(string){
	var wrongCharacters = ['ý', 'þ', 'ð'];
	var rightCharacters = ['ı', 'ş', 'ğ'];

	for(var i = 0; i < wrongCharacters.length; i++){
		while(string.indexOf(wrongCharacters[i]) > -1){
			string = string.replace(wrongCharacters[i], rightCharacters[i]);
		}
	}
	return string;
}

var getLanguageName = function(languageCode){
	var i = _.findIndex(loadedCountries, function(item){
		return item.language_a_code == languageCode;
	});
	return loadedCountries[i].language_a_name;	
}

function saveToDB(records, i, db, collection){

		collection.insert(records[i], function(err, docs) {
			if(err){
				throw err;
			}else{
				console.log('Obj succesfully saved to DB.');
				i++;
				if(i < records.length){
					saveToDB(records, i, db, collection);
				}else{
					db.close();
				}
			}
		}); 		
}

function getDateRangeDB(callback){
	console.log('Called getDateRangeDB.')

	MongoClient.connect('mongodb://127.0.0.1:27017/autocomplete', function(err, db) {
		console.log('Connecting to DB...');
		if(err) throw err;
		console.log('Connected.');
		var collection = db.collection('date_range');

		collection.find({}).toArray(function(err, results) {
			console.dir(results);
			// console.log(results[0].min);
			callback([results[0].min, results[0].max]);
			db.close();	// Let's close the db 
		});			
	});	
}

function searchMongoDB(params, callback){
	console.log('Called searchMongoDB.')
	// console.log(params);

	MongoClient.connect('mongodb://127.0.0.1:27017/autocomplete', function(err, db) {
		console.log('Connecting to DB...');
		if(err) throw err;
		console.log('Connected.');
		var collection = db.collection('records');

		// Locate all the entries using find 
		collection.find(params).toArray(function(err, results) {
			// console.dir(results);
			if(err) throw err;
			callback(results);
			db.close();	// Let's close the db 
		});		

	});
}

var getDomainsByService = function(service, callback){
	var filteredCountries = _.filter(loadedCountries, function(item, index, list){
		// Now also filtering by 'functional,' that is,
		// languages that don't have encoding problems
		return item[service] == 1 && item['functional'] == 1;
	});
	var filteredDomains = _.map(filteredCountries, function(item){
		return item.domain;
	});
	callback(filteredDomains);
}

loadedCountries = jf.readFileSync('data/languages.json');
// console.log(loadedCountries);
loadedServices = jf.readFileSync('data/services.json');
// console.log(loadedServices);

init();