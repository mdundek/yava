var http = require('http'); 
const { parse } = require('querystring');
const { NlpManager, NerManager } = require('node-nlp');

// var matchNlpManager = new NlpManager({ languages: ['en'] });
let matchNlpManager = null;
let nerManager = null;

let server = http.createServer(function (req, res) {   
	if (req.url == '/ping') {
		res.writeHead(200);
		res.end(); 
	}
    else if (req.url == '/train') {
		collectRequestData(req, result => {
			(async() => {
				const nlpManager = new NlpManager({ languages: [result.language] });
				let trainingData = JSON.parse(result.data)
				for(let intent in trainingData){
					trainingData[intent].forEach(utterance => {
						nlpManager.addDocument(result.language, utterance, intent);
					})
				}
				await nlpManager.train();
				nlpManager.save(result.intentsModelFile);
								
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.write(JSON.stringify({ message: "Hello World"}));  
				res.end(); 
			})();
		});
	} 
	else if (req.url == '/loadEntityData') {
		collectRequestData(req, result => {
			(async() => {
				let trainingData = JSON.parse(result.data)
				
				nerManager = new NerManager({ threshold: 0.8 });
				let allEntities = {}
				for(let intent in trainingData){
					trainingData[intent].forEach(utterance => {
						
						utterance[1].entities.forEach(entityPointer => {
							let entityValue = utterance[0].substring(entityPointer[0], entityPointer[1])
							if(!allEntities[entityPointer[2]])
								allEntities[entityPointer[2]] = []
								
							if(allEntities[entityPointer[2]].indexOf(entityValue) == -1)
								allEntities[entityPointer[2]].push(entityValue)
						})
					})
				}

				for(let LABEL in allEntities){
					allEntities[LABEL].forEach(val => {
						let lower = val.toLowerCase()

						nerManager.addNamedEntityText(
							LABEL,
							lower,
							[result.language],
							[lower.charAt(0).toUpperCase() + lower.substring(1)],
						);
					})
				}
				
				res.writeHead(200);
				// res.write(JSON.stringify({ message: "Hello World"}));  
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

					nerManager.findEntities(
						result.data,
						result.language,
					).then(entities => {
						returnObj.entities = entities

						res.writeHead(200, { 'Content-Type': 'application/json' });
						res.write(JSON.stringify({ "result": returnObj}));  
						res.end();
					})
				} else{
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.write(JSON.stringify({ "result": returnObj}));  
					res.end();
				}
								
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