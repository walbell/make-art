/*
 * Try Banner Controller
 *
 * Opens up when on challenge
 */

var app = require('../app');

app.controller('TryBannerController', function ($scope, $rootScope) {
    $rootScope.isBannerOpen = true;

    window.localStorage.clear();

    $scope.removeBanner = function () {
        console.log('change banner');
        $rootScope.isBannerOpen = false;
    };
});
