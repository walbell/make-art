"use strict";
var app = require('../app'),
    api,
    language = require('../language/index'),
    session = require('../language/session'),
    sound = require('../core/sound'),
    analytics = require('../core/analytics'),
    getValidator = require('../challenges/util/validator'),
    DEFAULT_SUCCESS_MESSAGE = 'Well done!', //null
    HINT_HIGHLIGHT_DELAY = 10000,
    VALIDATE_DELAY,
    config;
/*
 * Challenge Controller
 *
 * Controller for export modal
 */

app.controller('ChallengeController', function ($scope, $routeParams, $window, $timeout, $rootScope, $location, contentService) {
    var win = angular.element($window),
        hintTimer,
        worldId;

    config = $rootScope.cfg;

    /**
     * Returns true if the code compiles
     * @param  {string} code The coffeescript code
     * @return {boolean}     True if the code compiles
     */
    function isValidCode(code) {
        var err,
            // Create a canvas element
            canvas = document.createElement('canvas'),
            ctx;
        canvas.width = 500;
        canvas.height = 400;

        // Get the fake drawing context
        ctx = canvas.getContext('2d');
        err = language.run(code, {ctx: ctx});
        canvas = undefined;
        return (typeof err === 'undefined');
    }



    /**
     * Saves code in the local storage
     * @param  {string} code a string containing the code
     */
    function saveCode(code) {
        localStorage["code_" + $scope.worldId + "_" + $scope.id] = code;
    }



    /**
     * Returns the next challenge in the world if it exists
     * @return {object} The next Challenge in the world
     */
    function getNextChallenge() {
        var position = $scope.index,
            challenges = $rootScope.selectedWorld.challenges;
        return challenges[position];
    }



    /**
     * Asynchronously loads the challenge
     */
    function loadChallenge() {
        contentService.getChallenge($scope.worldId, $scope.id).then(function (challenge) {
            var lsCode;

            if ($scope.isChallengeLocked(challenge)) {
                $location.path('/challenges/' + $rootScope.selectedWorld.id);
            }

            lsCode = localStorage["code_" + $scope.worldId + "_" + $scope.id];

            $scope.lastChallengeVisited.set($scope.worldId, $scope.index); //???

            $scope.content = challenge;
            $scope.index = challenge.index;
            $scope.challenge = { code: lsCode || $scope.content.code };
            $scope.validator = getValidator($scope.content.steps, config.languageSynonyms);

            $scope.next = getNextChallenge();

            setStep(0);
            $scope.started = true;
            $scope.animationClass = '';
            analytics.track('Started Challenge ' + $scope.id, {
                category: 'Started Challenge'
            });

            $scope.$watch('step', function (step) {
                $scope.hint = $scope.content.steps[step] ? $scope.content.steps[step].hint : null;
                $scope.solution = $scope.getSolution();
                animateAndPlaySound(step);
            });
        });
    }



    /**
     * Initialise controller
     *
     * @return void
     */
    function init() {
        $scope.nextModal = false;
        $rootScope.shareModal = false;
        $scope.closeChallengeComplete();
        api = $rootScope.api;
        VALIDATE_DELAY = $rootScope.cfg.OFFLINE ? 1020 : 20;

        $scope.id = $routeParams.id;
        $scope.worldId = $routeParams.world;

        $scope.intro = true;



        if (!$rootScope.selectedWorld) {
            //You're hitting the address directly, and we need to load the world's information
            contentService.getWorld("worlds/" + $scope.worldId).then(function (data) {
                $scope.challenges = data.challenges;
                $rootScope.selectedWorld = data;
                worldId = $rootScope.selectedWorld.id;
                loadChallenge();
            });
        } else {
            loadChallenge();
            worldId = $rootScope.selectedWorld.id;

        }
    }

    $scope.openNextModal = function () {
        $scope.nextModal = true;
    };

    $scope.closeNextModal = function () {
        $scope.nextModal = false;
    };

    $scope.openShareModal = function () {
        $rootScope.shareModal = true;
    };

    /**
     * Goes to the next challenge depending on the world locking strategy
     * @return {[type]} [description]
     */
    $scope.goToNext = function () {
        if ($rootScope.selectedWorld.share_strategy === 'mandatory') {
            $scope.openShareModal();
        } else {
            $scope.openNextModal();
        }
    };

    $scope.successful = false;

    $rootScope.$watch('successful', function (val) {
        if (val) {
            $scope.next.locked = $scope.isChallengeLocked($scope.next) ? true : false;

            $scope.openNextModal();
        }
    });

    $scope.isChallengeLocked = function (challenge) {
        var index = challenge.index,
            now = new Date(),
            start_date = challenge.start_date;

        if (start_date) {
            start_date = new Date(start_date);
            if (start_date > now) {
                return true;
            }
        }

        return index > $rootScope.progress.groups[$scope.worldId].challengeNo;
    };

    /*
     * Get back to first step
     *
     * @return void
     */
    $scope.restart = function () {
        $scope.step = 0;
        $scope.completed = false;
    };

    /*
     * Show / Hide solution
     *
     * @return void
     */
    $scope.toggleSolution = function () {
        if (hintTimer) {
            $timeout.cancel(hintTimer);
        }
        $scope.highlightHelp = false;
        $scope.showSolution = !$scope.showSolution;
    };

    /*
     * Validate code to determine success of challenge
     *
     * @return void
     */
    $scope.validate = function () {
        // Next tick...
        setTimeout(function () {
            var code = language.strip($scope.challenge.code),
                step = 0,
                steps = $scope.content.steps,
                finished,
                report;


            report = $scope.validator.validate(code, steps);

            $scope.challengeReport = report;

            step = (report.lastValidStep !== null) ? report.lastValidStep + 1 : 0;

            if (report.complete || (step >= steps.length && isValidCode(code))) {
                //we consider complete the code of a user who reached the last step and broke previous ones
                //as long as the code compiles
                finished = true;
            }

            if (step > $scope.step) {
                //we have a new valid step
                setStep(step);
                saveCode(code);
            }

            if (session.steps && finished && !$scope.completed) {
                analytics.track('Completed Challenge ' + $scope.id, {
                    category: 'Completed Challenge'
                });
                $scope.completed = true;

                $rootScope.updateProgress(worldId, $scope.index + 1);
                api.progress.trackLinesOfCode($scope.challenge.code.split('\n').length);

            }

            $scope.$apply();

        }, VALIDATE_DELAY);
    };

    /*
     * Set current challenge step
     *
     * @param {Number} index
     * @return void
     */
    function setStep(index) {
        if (hintTimer) {
            $timeout.cancel(hintTimer);
        }

        $scope.highlightHelp = false;

        $scope.step = index;
        $scope.showSolution = false;

        hintTimer = $timeout(function () {
            $scope.highlightHelp = true;
        }, HINT_HIGHLIGHT_DELAY);
    }

    /*
     * Get current step solution
     *
     * @return {String}
     */
    $scope.getSolution = function () {
        var steps = $scope.content.steps,
            i,
            solution = "";


        if (!steps) {
            return null;
        }
        for (i = 0; i <= $scope.step; i++) {
            if (steps[i]) {
                solution += steps[i].solution + "\n";
            }
        }
        return solution;
    };

    /*
     * Show success message
     *
     * @return void
     */
    $scope.successMessage = function () {
        //If we are executing draw on Pi we want to show the xp gained
        var xpGain = parseInt($scope.xpGain, 10),
            successMsg = $scope.content.completion_text || DEFAULT_SUCCESS_MESSAGE,
            xpMessage = xpGain ? ' You earned ' + $scope.xpGain + 'xp!' : '',
            onlineMessage = successMsg,
            offlineMessage = onlineMessage + xpMessage;

        return $rootScope.cfg.OFFLINE ? offlineMessage : onlineMessage;
    };

    /*
     * Start challenge after reading the intro
     *
     * @return void
     */
    $scope.start = function () {
        $scope.started = true;
    };

    /*
     * Show complete challenge panel
     *
     * @return void
     */
    $scope.challengeComplete = function () {
        $scope.isChallengeCompleteOpen = true;
    };

    /*
     * Hide complete challenge panel
     *
     * @return void
     */
    $scope.closeChallengeComplete = function () {
        $scope.isChallengeCompleteOpen = false;
    };

    // Listen for key press
    win.bind('keydown', function (e) {
        if (e.keyCode === 27) { // ESC
            $scope.$apply();
        }
    });

    /*
     * Animate progress circle and play sound
     *
     * @return void
     */
    function animateAndPlaySound(step) {
        if (step) {
            $scope.animationClass = 'animate-pulse';

            if (step < $scope.content.steps.length) {
                sound.play('pop');
            } else {
                sound.play('success');
            }

            $timeout(resetAnimation, 500);
        }

        function resetAnimation() {
            $scope.animationClass = '';
        }
    }

    /*
     * Close game completion modal
     *
     * @return void
     */
    $scope.openFinishedGame = function () {
        $scope.gameCompleteOpen = true;
    };

    /*
     * Close game completion modal
     *
     * @return void
     */
    $scope.closeFinishedGame = function () {
        $scope.challengeCompleteOpen = false;
    };

    $scope.backToApps = function () {
        console.log('backToApps');
        $scope.restart();
        $rootScope.isBannerOpen = true;
    };

    init();
});
