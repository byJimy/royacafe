'use strict';

const request = require('request-promise').defaults({ encoding: null });

module.exports = {
    predict: predict
}

function predict(stream) {
    const options = {
        method: 'POST',
        url: 'https://southcentralus.api.cognitive.microsoft.com/customvision/v1.0/Prediction/6f171ce9-e745-4804-8fb7-4280d497e648/image?iterationId=f7218c18-71f9-4791-8e09-6b684f3d84ca',        
        headers: {
            'Content-Type': 'application/octet-stream',
            'Prediction-Key': '4c19f7c0db334965bbc5bf5eb7cac44c'
        },        
        body: stream
    };

    return request(options);
}
