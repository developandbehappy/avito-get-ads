var Nightmare = require('nightmare');
var notifier = require('node-notifier');
var _ = require('lodash');
var nightmare = Nightmare({show: false});

var currentLoad = 0;
var countMatchedAds = 0;
var firstLoad = true;
var latestAds = [];
var wishPriceSearchAds = 10000;

startSearchingAds('https://www.avito.ru/rostov-na-donu/noutbuki');


function startSearchingAds(url) {
  nightmare.goto(url).evaluate(function () {
    return document.querySelectorAll('.js-catalog_after-ads .js-catalog-item-enum').length
  }).then(function (result) {
    handlerHtmlAndReturnAds(0, result - 5);
  }).catch(function (error) {
    console.error('an error has occurred: ' + error);
  });
}

/**
 * Show notify
 * @param data
 * data.title, data.description, data.url, data.subtitle
 */
function showMeNotify(data) {
  notifier.notify({
    title: data.title,
    subtitle: 'Стоимость: ' + data.price,
    message: data.date,
    contentImage: 'Avito-icon.png',
    sound: 'Hero',
    timeout: 10,
    open: data.link
  });
}


function handlerHtmlAndReturnAds(id, limit) {
  nightmare.evaluate(function (idAd) {
    return {
      title: document.querySelectorAll('.js-catalog_after-ads .js-catalog-item-enum .item-description-title-link')[idAd].innerText,
      price: document.querySelectorAll('.js-catalog_after-ads .js-catalog-item-enum .about')[idAd].innerText,
      date: document.querySelectorAll('.js-catalog_after-ads .js-catalog-item-enum .date')[idAd].innerText,
      link: document.querySelectorAll('.js-catalog_after-ads .js-catalog-item-enum .js-photo-wrapper')[idAd].href
    };
    // return idAd
  }, id).then(function (res) {
    currentLoad++;
    if (currentLoad > limit) {
      getNewAds();
    } else {
      latestAds.push(res);
      handlerHtmlAndReturnAds(currentLoad, limit);
    }
  }).catch(function (error) {
    console.error('an error has occurred: ' + error);
  });
}


function getNewAds() {
  if (firstLoad) {
    firstLoad = false;
  } else {
    if (countMatchedAds !== _.size(getAdsByPrice(wishPriceSearchAds))) {
      showMeNotify(getAdsByPrice(wishPriceSearchAds)[0]);
      countMatchedAds = _.size(getAdsByPrice(wishPriceSearchAds));
    }
    latestAds = _.uniqBy(latestAds, function (e) {
      return e.title;
    });
  }
  console.log('====================================');
  console.log('latestAds', getAdsByPrice(wishPriceSearchAds));
  console.log('====================================');
  setTimeout(function () {
    startSearchingAds('https://www.avito.ru/rostov-na-donu/noutbuki');
  }, 10000);
}

function getAdsByPrice(price) {
  return _.filter(latestAds, function (item) {
    return parseInt(item.price.replace(/\s+/g, '')) >= price;
  })
}
