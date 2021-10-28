'use strict';

const needle = require('needle');

module.exports = {
    convertToPercentWithoutRounding: convertToPercentWithoutRounding,
    hasImageAttachment: hasImageAttachment,
    getImageStreamFromMessage: getImageStreamFromMessage
}

function convertToPercentWithoutRounding(number) {    
    number = number.toString();
    var temp = number.split(".");
    number = temp[1];
    number = number.substr(0, 4);
    return (number / 100) + "%";
}

// Utilities code are from https://github.com/Microsoft/BotBuilder-Samples/blob/master/Node/intelligence-ImageCaption/app.js
function hasImageAttachment(session) {
    return session.message.attachments.length > 0 &&
        session.message.attachments[0].contentType.indexOf('image') !== -1;
}

function getImageStreamFromMessage(message) {
    var headers = {};
    var attachment = message.attachments[0];
    if (checkRequiresToken(message)) {
        // The Skype attachment URLs are secured by JwtToken,
        // you should set the JwtToken of your bot as the authorization header for the GET request your bot initiates to fetch the image.
        // https://github.com/Microsoft/BotBuilder/issues/662
        connector.getAccessToken(function (error, token) {
            var tok = token;
            headers['Authorization'] = 'Bearer ' + token;
            headers['Content-Type'] = 'application/octet-stream';

            return needle.get(attachment.contentUrl, { headers: headers });
        });
    }

    headers['Content-Type'] = attachment.contentType;
    return needle.get(attachment.contentUrl, { headers: headers });
}

function checkRequiresToken(message) {
    return message.source === 'skype' || message.source === 'msteams';
}