'use strict';

// require('dotenv').config();

const builder = require('botbuilder');
const restify = require('restify');
const cognitiveServices = require('botbuilder-cognitiveservices');
const customVisionService = require('./customVisionService.js');
const utils = require('./utils.js');
const regionService = require('./regionService.js');
const {Wit, log} = require('node-wit');


// Create chat connector for communicating with the Bot Framework Service
const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`${server.name} listening to ${server.url}`);
});
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

// Configuracion de almacenamiento de la conversacion en memoria
var inMemoryStorage = new builder.MemoryBotStorage();

// Configuracion para llamar al archivo index.html
server.get('/', restify.plugins.serveStatic({
  directory: __dirname,
  default: '/index.html'	
})); 

const bot = new builder.UniversalBot(connector,
// -------------------------------------------------  MENSAJE CARD DESPUES DE LA RESPUESTA ---------------------------------------- //
    function(session){
        var welcomeCard = new builder.HeroCard(session)
        .title("¡Saludos! Soy Royabot")
        .subtitle("Seré tu asistente personal de atención. ℹ Escribe \"mostrar menú\" o \"#\" en cualquier momento para ver el menú.")
            .images([
                new builder.CardImage(session)
                .url('https://cdn-images-1.medium.com/max/327/1*paQ7E6f2VyTKXHpR-aViFg.png')
                .alt('RoyaBot')
            ])
        .buttons([
            builder.CardAction.imBack(session, "Mostrar Menu", "Mostrar Menu")
        ]);
    session.send(new builder.Message(session).addAttachment(welcomeCard));
    }
).set('storage', inMemoryStorage);
// --------------------------------------------------------------------------------------------------------------------------------- //


// Listen for messages from users
server.post('/api/messages', connector.listen());

// --------------------------------------------------------  MENU  ------------------------------------------------------------------ //
bot.dialog('showMenu',[
    function(session){
        var menucards = [];

        var trackClaimCard = new builder.HeroCard(session)
                .title("Busqueda de Roya")
                .subtitle("Sube una imagen para detectar el nivel de roya.")
                .images([
                    new builder.CardImage(session)
                    .url('https://myappsoftwarestorage.blob.core.windows.net/iicabot/royasearch.png')
                    .alt('Detector de roya')
                ])
                .buttons([
                    builder.CardAction.imBack(session, "Detector de roya", "Detector de roya")
                ]);
            menucards.push(trackClaimCard);

        var msg = new builder.Message(session)
            .text("Mis habilidades todavía están creciendo. En pocas palabras, esto es lo que puedo hacer:")
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(menucards);
        session.send(msg);
    },

    function(session, results) {
        session.endDialogWithResult(results);
    }
]).triggerAction({
    matches: [/^Mostrar Menu$/i, /#/i]
});


// ----------------------------------------- ITEM -- DETECTOR DE ROYA ---------------------------------------------------------------------------
bot.dialog('royaDetector', [
	function (session){
		session.send("Bienvenido al Detector de roya 🔍");
        session.beginDialog('dialogRoya');
        var msg = new builder.Message(session)
        .text("Bien, empecemos 🚀. Sube una imagen para que yo lo pueda analizar ")
        session.send(msg);	
	},
	function(session, results) {
		session.endDialogWithResult(results);	
	}
])
.triggerAction({
	matches: [/Detector de roya/i, /detector/i, /roya/i, /estado de roya/i, /estado/i, /enfermedad de roya/i, /detalle de hoja/i], 
	confirmPrompt: "⚠️ Esto cancelará su solicitud actual. ¿Estás seguro? (yes/No)"
});
// -------------------------------------------------------------------------------------------------------------------------------------------------- //


// ----------------------------------------------- FUNCION PARA LA DETECION DE IMAGENES ------------------------------------------------------------
bot.dialog('dialogRoya',[
	function (session){   
        
        session.sendTyping();
        if (utils.hasImageAttachment(session)) {
            var stream = utils.getImageStreamFromMessage(session.message);
            customVisionService.predict(stream)
                .then(function (response) {
                    // Convert buffer into string then parse the JSON string to object
                    var jsonObj = JSON.parse(response.toString('utf8'));
                    console.log(jsonObj);
                    var topPrediction = jsonObj["Predictions"][0];
    
                    // make sure we only get confidence level with 0.80 and above
                    if (topPrediction.Probability >= 0.80) {
                        var probability = utils.convertToPercentWithoutRounding(topPrediction.Probability);
                        session.send(`Estoy ${probability} seguro de que este es un ${topPrediction.Tag}. de ROYA`);
                        
                        setTimeout(function () {
                            session.send(`Déjame encontrar algun centro en tu region mas cercano para que puedas tener mejor ayuda con este  ${topPrediction.Tag} de roya` );
                            session.sendTyping();
    
                            setTimeout(function () {
                                var filteredRestaurants = regionService.getRestaurantsList(topPrediction.Tag);
                                var message = new builder.Message()
                                    .attachmentLayout(builder.AttachmentLayout.carousel)
                                    .attachments(filteredRestaurants.map(regionService.restaurantAsAttachment));
    
                                session.send(message);
                            }, 2000);
                        }, 1000);
    
                    } else {
                        session.send('¡Lo siento! No sé lo que es eso 😕');
                    }
                }).catch(function (error) {
                    console.log(error);
                    session.send('❗ Vaya, hay algo mal con el procesamiento de la imagen. Inténtalo de nuevo.❗');
                });
        }
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);
// -------------------------------------------------------------------------------------------------------------------------------------------------//

// Diálogo para mostrar el menú después de completar las tareas solicitadas
// bot.dialog('askforMore',[
// 	function (session){
		
// 		session.send("How else can I help you?");
// 		session.sendTyping();
// 		setTimeout(function () {
// 			session.beginDialog('showMenu');
// 		}, 5000);		
// 		/*
// 		builder.Prompts.choice(session, "How else can I help you?", mainMenu, builder.ListStyle.button);		
// 	},
// 	function (session, results) {
// 		if(results.response.entity == 'Seguimiento de reclamo'){
// 			session.beginDialog('trackClaim');
// 		}
// 		else if(results.response.entity == 'Download E-Card'){
// 			session.beginDialog('downloadEcard');
// 		}
// 		else if(results.response.entity == 'Red de búsqueda Hospitals'){
// 			session.beginDialog('searchNetwork');
// 		}
// 	},
// 	function(session, results) {
// 		session.endDialogWithResult(results);	*/
// 	}
// ]);

// ------------------- Mensaje de bienvenida ------- //
bot.on('conversationUpdate', function (activity) {
    // when user joins conversation, send instructions
    if (activity.membersAdded) {
        activity.membersAdded.forEach(function (identity) {
            if (identity.id === activity.address.bot.id) { 
                var reply = new builder.Message()
                    .address(activity.address)
                    .text('Hola!');
                bot.send(reply);
            }
        });
    }
});
// ------------------------------------------------- //
