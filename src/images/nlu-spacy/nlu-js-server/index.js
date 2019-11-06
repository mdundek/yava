var http = require('http'); 
const { parse } = require('querystring');
const { NlpManager } = require('node-nlp');

// var matchNlpManager = new NlpManager({ languages: ['en'] });
var matchNlpManager = null;


var server = http.createServer(function (req, res) {   
	if (req.url == '/ping') {
		res.writeHead(200);
		res.end(); 
	}
    else if (req.url == '/train') {
		collectRequestData(req, result => {
			(async() => {
				const manager = new NlpManager({ languages: [result.language] });
				let allIntents = JSON.parse(result.data)
				for(let intent in allIntents){
					allIntents[intent].forEach(utterance => {
					manager.addDocument(result.language, utterance, intent);
					})
				}
				await manager.train();
				manager.save(result.intentsModelFile);
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.write(JSON.stringify({ message: "Hello World"}));  
				res.end(); 
			})();
		});
	} 
    else if (req.url == '/match') {
		collectRequestData(req, result => {
			(async() => {
				if(matchNlpManager == null){
					matchNlpManager = new NlpManager();
					matchNlpManager.load(result.intentsModelFile)
				}

				const response = await matchNlpManager.process(result.language, result.data);
				// console.log(JSON.stringify(response, null, 4));
				let returnObj = {}
				if(response.intent != "None"){
					returnObj.intent = response.intent;
					returnObj.confidence = response.score;
					returnObj.entities = response.entities;
				}
				
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.write(JSON.stringify({ "result": returnObj}));  
				res.end(); 
			})();
		});
    }
    else if (req.url == '/exit') {
      res.writeHead(200);
      res.end(); 

      server.close();
    }  
    else{
      res.end();  
    }
});

function collectRequestData(request, callback) {
  const FORM_URLENCODED = 'application/x-www-form-urlencoded';
  if(request.headers['content-type'] === FORM_URLENCODED) {
      let body = '';
      request.on('data', chunk => {
          body += chunk.toString();
      });
      request.on('end', () => {
          callback(parse(body));
      });
  }
  else {
      callback(null);
  }
}

server.listen(8000);