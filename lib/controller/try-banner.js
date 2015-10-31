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
            'description': 'A mysterious choose-your-own adventure. Control the story with computer commands.'
        },
        'make_snake': {
            'title': 'Make Snake',
            'description': 'Eat Apples, don\'t bite your tail. Simple Linux spells give kids the chance to share their own Snake boards.'        },
        'make_minecraft': {
            'title': 'Make Minecraft',
            'description': 'Drag and drop jigsaw code blocks, and make Minecraft your own. Change the rules, craft castles, become the Master Builder.'
        },
        'make_pong': {
            'title': 'Make Pong',
            'description': 'Code the arcade classic. Add sounds, crazy rules, and powerups. "Kids are making (and changing) my game with Kano." -Al Alcorn, inventor, Pong'
        },
        'make_music': {
            'title': 'Make Music',
            'description': 'Move over Kanye, you can make beats, melodies, and songs with code. Rock the world with loops and variables.'
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
        $scope.appImage = '';
        $scope.showDescriptionFlag = false;
        $timeout(function() {
            $scope.showGridFlag = true;
        }, 300);

    };
});
