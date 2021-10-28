'use strict';

const _ = require("underscore");
const builder = require('botbuilder');

module.exports = {
    getRestaurantsList: getRestaurantsList,
    restaurantAsAttachment: restaurantAsAttachment
}
// Variables de respuesta para cuando haga match el resultado
function getRestaurantsList(foodName) {
    var restaurants = [
        { name: 'ICAFE SAN JOSE', foodList: ['10%', '20%', '40%', '50%'], rating: Math.ceil(Math.random() * 5), location: 'Costa Rica', logo: 'http://www.icafe.cr/wp-content/uploads/2015/02/logo_icafe.png' },
        { name: 'ICAFE', foodList: ['10%', '20%', '40%', '50%'], rating: Math.ceil(Math.random() * 5), location: 'Costa Rica', logo: 'http://www.icafe.cr/wp-content/uploads/2015/02/logo_icafe.png' },
        { name: 'iica', foodList: ['10%', '20%', '40%', '50%'], rating: Math.ceil(Math.random() * 5), location: 'Costa Rica', logo: 'https://i.vimeocdn.com/portrait/4556466_300x300' }
    ];

    var filteredRestaurants = _.filter(restaurants, function (res) {
        return res.foodList.indexOf(foodName) > -1;
    });
    return filteredRestaurants;
}

function restaurantAsAttachment(restaurant) {
    return new builder.HeroCard()
        .title(restaurant.name)
        .subtitle('%d star(s) rating.', restaurant.rating)
        .images([new builder.CardImage().url(restaurant.logo)])
        .buttons([
            new builder.CardAction()
                .title('Ver en gogle maps')
                .type('openUrl')
                .value('https://www.google.com.ph/maps/search/' +
                encodeURIComponent(restaurant.name) + ' in ' + encodeURIComponent(restaurant.location))
        ]);
}