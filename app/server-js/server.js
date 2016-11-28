const express = require('express'); 
const fs = require('fs');
const serverPostHandler = require('./serverPostHandler.js');
const bodyParser = require('body-parser');
//---------------------------------------

const app = express();
const port = 3000;

const requestHandler = (request, response) => {	
	getFileFromUrl(request.url, (err,data,contentType,encoding) => {
		if(err){
			console.log(err);
		} else {
			console.log(`dobry explain`);
			response.set('Content-Type', contentType);
			response.send(new Buffer(data,encoding));
		}
		
	});	
}	

const postHandler = (request, response) => {	
	serverPostHandler.handleTestQuery(request, response);
}


app.use(bodyParser.json());

app.get(/^\.*/, requestHandler);
app.post(/^\.*/, postHandler);

var server = app.listen(port, () => {  
	console.log(`server is listening on ${port}`);
})


function getFileFromUrl(url, fn){

	var map = {
		'/' : '/index.html'
	}

	var suffix = url.split('.');
	if (suffix.length > 1){
		suffix = suffix[suffix.length-1];
	}
	else{
		suffix = null;
	}

	var contentType = {
		'png':  'image/png',
		'ico':  'image/x-icon',
		'gif':  'image/gif',
		'css':  'text/css'
	}[suffix] || 'text/html';

	var encoding = (()=>{
		if (contentType.indexOf('text/') !== -1){
			return 'utf8';
		}
		else if (contentType.indexOf('image/') !== -1){
			return 'binary';
		}
		else{
			return 'utf8';
		}
	})();

	console.log('reading file ' + url + ' with ' + encoding + ' encoding');

	fs.readFile('../' + (map[url] || url), encoding, function (err, data) {
		fn(err, data, contentType, encoding);
	});
}