/*
 * Try Banner Controller
 *
 * Opens up when on challenge
 */

var app = require('../app');

app.controller('TryBannerController', function ($scope, $rootScope, $timeout) {
    $rootScope.isBannerOpen = true;
    $scope.showDescriptionFlag = false;
    $scope.showGridFlag = true;

    window.localStorage.clear();

    $scope.appDescriptions = {
        'tq': {
            'title': 'Terminal Quest',
            'description': 'This is Terminal Quest and its description. Play it just from the Kano Kit'
        },
        'make_snake': {
            'title': 'Make Snake',
            'description': 'This is Make Snake and its description. Play it just from the Kano Kit'        },
        'make_minecraft': {
            'title': 'Make Minecraft',
            'description': 'This is Make Minecraft and its description. Play it just from the Kano Kit'
        },
        'make_pong': {
            'title': 'Make Pong',
            'description': 'This is Make Pong and its description. Play it just from the Kano Kit'
        },
        'make_music': {
            'title': 'Make Music',
            'description': 'This is Make Music and its description. Play it just from the Kano Kit'
        }
    };

    $scope.removeBanner = function () {
        console.log('change banner');
        $rootScope.isBannerOpen = false;
    };

    $scope.showDescription = function (app_slug) {
        console.log('setting to true', app_slug);

        console.log('appDescriptions.app_slug', $scope.appDescriptions[app_slug]);

        $scope.appTitle = $scope.appDescriptions[app_slug].title;
        $scope.appDescription = $scope.appDescriptions[app_slug].description;
        $scope.appImage = '/assets/app-screenshots/' + app_slug + '.png';

        $scope.showDescriptionFlag = true;
        $scope.showGridFlag = false;
    };

    $scope.hideDescription = function () {
        $scope.showDescriptionFlag = false;
        $timeout(function() {
            $scope.showGridFlag = true;
        }, 300);

    };
});
