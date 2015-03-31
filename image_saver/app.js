var request = require('request'),
		 fs = require('fs'),
		 jf = require('jsonfile');

var detectExtension = function(string){
	console.log('Called detectExtension.');
	var i = 0;
	while(string.toLowerCase().indexOf(extensions[i]) < 0 &&
		  i < extensions.length){
		i++;
	}
	var extension = extensions[i];
	// console.log(extension);
	return '.' + extension;
}

var spacesToUnderscore = function(string){
	console.log('Called spacesToUnderscore.');
	while(string.indexOf(' ') > -1){
    	string = string.replace(' ', '_');
    }
    return string;
}

var nextIteration = function(i){
	i++;
	if(i < records.length){
		console.log('Jumping to next.');
		downloadImage(i);
	}
}

var downloadImage = function(i){

	console.log('Query: ' + records[i]['query']);
	console.log('URL? ' + records[i]['url']);
	console.log('Saved? ' + records[i]['saved']);

	if(records[i]['url'] != undefined &&
	   records[i]['url'] != '' &&				// there's an url
	   records[i]['saved'] == undefined &&		// the file hasn't been saved yet
	   records[i]['language_code'] == languageCode){

		console.log('******************************************');
		console.log('Requesting download...');

		var filename = spacesToUnderscore(records[i]['language_name']).toLowerCase() + '_' +
					   records[i]['letter'] + '_' +
					   records[i]['ranking'] + '_' +
					   spacesToUnderscore(records[i]['query']) + '_' +
					   detectExtension(records[i]['url']);
		
		console.log('>>>>> index: ' + i);
		console.log(filename);

		var f = fs.createWriteStream(path + filename);
		f.on('finish', function(){
			console.log('Finished saving image to file.');
			updatedRecords[i]['saved'] = true;
			jf.writeFileSync('../db/images_2015_03_24.json', updatedRecords);

			nextIteration(i);
		});

		request({
				uri: records[i]['url'],
				timeout: 10000
			})
			.on('response', function(){
				console.log('Server responded.');
			})
			.on('timeout', function(){
				nextIteration(i);
			})			
			.on('error', function(err) {
    			console.log(err)
				nextIteration(i);    			
  			})
			.pipe(f);
	}else{
		nextIteration(i);
	}	
}

var records = jf.readFileSync('../db/images_2015_03_24.json');
var updatedRecords = records;
// console.log(records);

var path = '../../../../../Desktop/_images/';
var extensions = ['jpg', 'jpeg', 'png', 'gif', 'tif', 'tiff', 'bmp'];
var languageCode = 'es';

downloadImage(0);