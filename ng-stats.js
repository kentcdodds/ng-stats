(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory;
  } else {
    root.showAngularStats = factory();
  }
}(window, function() {
  'use strict';
  var autoloadKey = 'showAngularStats_autoload';
  var current = null;
  // define the timer function to use based upon whether or not 'performance is available'
  var timerNow = window.performance
    ? function() { return performance.now(); }
    : function() { return Date.now(); };

  var lastWatchCountRun = timerNow();
  var watchCountTimeout = null;
  var lastWatchCount = getWatcherCount() || 0;
  var lastDigestLength = 0;

  var $rootScope;

  var digestIsHijacked = false;

  var listeners = {
    digest: [],
    watchCount: [],
    digestLength: []
  };

  // Hijack $digest to time it and update data on every digest.
  function hijackDigest() {
    if (digestIsHijacked) {
      return;
    }
    digestIsHijacked = true;
    var $rootScope = getRootScope();
    var scopePrototype = Object.getPrototypeOf($rootScope);
    var oldDigest = scopePrototype.$digest;
    scopePrototype.$digest = function $digest() {
      var start = timerNow();
      oldDigest.apply(this, arguments);
      var diff = (timerNow() - start);
      updateData(getWatcherCount(), diff);
    };
  }

  // check for autoload
  var autoloadOptions = sessionStorage[autoloadKey];
  if (autoloadOptions) {
    autoload(JSON.parse(autoloadOptions));
  }

  function autoload(options) {
    if (window.angular && getRootScope()) {
      showAngularStats(options);
    } else {
      // wait for angular to load...
      window.setTimeout(function() {
        autoload(options);
      }, 200);
    }
  }

  function showAngularStats(opts) {
    // delete the previous one
    if (current) {
      current.$el && current.$el.remove();
      current.active = false;
      current = null;
    }

    // do nothing if the argument is false
    if (opts === false) {
      sessionStorage.removeItem(autoloadKey);
      return;
    } else {
      opts = angular.extend({
        position: 'top-left',
        digestTimeThreshold: 16,
        autoload: false
      }, opts || {});
    }

    hijackDigest();

    // setup the state
    var state = current = { active:true };

    // auto-load on startup
    if (opts.autoload) {
      sessionStorage.setItem(autoloadKey,JSON.stringify(opts));
    } else {
      sessionStorage.removeItem(autoloadKey);
    }

    // general variables
    var bodyEl = angular.element(document.body);
    var noDigestSteps = 0;

    // add the DOM element
    state.$el = angular.element('<div><canvas></canvas><div></div></div>').css({
      position: 'fixed',
      background: 'black',
      borderBottom: '1px solid #666',
      borderRight: '1px solid #666',
      color: 'red',
      fontFamily: 'Courier',
      width: 130,
      zIndex: 9999,
      top: opts.position.indexOf('top') == -1 ? null : 0,
      bottom: opts.position.indexOf('bottom') == -1 ? null : 0,
      right: opts.position.indexOf('right') == -1 ? null : 0,
      left: opts.position.indexOf('left') == -1 ? null : 0,
      textAlign: 'right'
    });
    bodyEl.append(state.$el);
    var $text = state.$el.find('div');

    // initialize the canvas
    var graphSz = { width: 130, height: 40 };
    var cvs = state.$el.find('canvas').attr(graphSz)[0];


    // replace the digest
    listeners.digestLength.push(function(digestLength) {
      addDataToCanvas(null, digestLength);
    });

    listeners.watchCount.push(function(watchCount) {
      addDataToCanvas(watchCount);
    });

    function addDataToCanvas(watchCount, digestLength) {
      var averageDigest = digestLength || lastDigestLength;
      var color = (averageDigest > opts.digestTimeThreshold) ? 'red' : 'green';
      lastWatchCount = nullOrUndef(watchCount) ? lastWatchCount : watchCount;
      lastDigestLength = nullOrUndef(digestLength) ? lastDigestLength : digestLength;
      $text.text(lastWatchCount + ' | ' + lastDigestLength.toFixed(2)).css({color:color});

      if (!digestLength) {
        return;
      }

      // color the sliver if this is the first step
      var ctx = cvs.getContext('2d');
      if (noDigestSteps > 0) {
        noDigestSteps = 0;
        ctx.fillStyle = '#333';
        ctx.fillRect(graphSz.width - 1, 0, 1, graphSz.height);
      }

      // mark the point on the graph
      ctx.fillStyle = color;
      ctx.fillRect(graphSz.width-1,Math.max(0,graphSz.height - averageDigest),2,2);
    }

    //! Shift the canvas to the left.
    function shiftLeft() {
      if (state.active) {
        window.setTimeout(shiftLeft,250);
        var ctx = cvs.getContext('2d');
        var imageData = ctx.getImageData(1,0,graphSz.width-1,graphSz.height);
        ctx.putImageData(imageData,0,0);
        ctx.fillStyle = ((noDigestSteps++)>2) ? 'black' : '#333';
        ctx.fillRect(graphSz.width-1,0,1,graphSz.height);
      }
    }

    // start everything
    shiftLeft();
    if(!$rootScope.$$phase) {
      $rootScope.$digest();
    }
  }

  angular.module('angularStats', []).directive('angularStats', function() {
    'use strict';
    hijackDigest();
    return {
      scope: {
        digestLength: '@',
        watchCount: '@',
        watchCountRoot: '@',
        onDigestLengthUpdate: '&?',
        onWatchCountUpdate: '&?'
      },
      link: function(scope, el, attrs) {

        if (attrs.hasOwnProperty('digestLength')) {
          var digestEl = el;
          if (attrs.digestLength) {
            digestEl = angular.element(el[0].querySelector(attrs.digestLength));
          }
          listeners.digestLength.push(function(length) {
            digestEl.text((length || 0).toFixed(2));
          });
        }

        if (attrs.hasOwnProperty('watchCount')) {
          var watchCountRoot;
          var watchCountEl = el;
          if (scope.watchCount) {
            watchCountEl = angular.element(el[0].querySelector(attrs.watchCount));
          }

          if (scope.watchCountRoot) {
            if (scope.watchCountRoot === 'this') {
              watchCountRoot = el;
            } else {
              // In the case this directive is being compiled and it's not in the dom,
              // we're going to do the find from the root of what we have...
              var rootParent;
              if (attrs.hasOwnProperty('watchCountOfChild')) {
                rootParent = el[0];
              } else {
                rootParent = findRootOfElement(el);
              }
              watchCountRoot = angular.element(rootParent.querySelector(scope.watchCountRoot));
              if (!watchCountRoot.length) {
                throw new Error('no element at selector: ' + scope.watchCountRoot);
              }
            }
          }

          listeners.watchCount.push(function(count) {
            var watchCount = count;
            if (watchCountRoot) {
              watchCount = getWatcherCountForElement(watchCountRoot);
            }
            watchCountEl.text(watchCount);
          });
        }

        if (scope.onWatchCountUpdate) {
          listeners.watchCount.push(function(count) {
            scope.onWatchCountUpdate({watchCount: count});
          });
        }

        if (scope.onDigestLengthUpdate) {
          listeners.digestLength.push(function(length) {
            scope.onDigestLengthUpdate({digestLength: length});
          });
        }
      }
    };

    function findRootOfElement(el) {
      var parent = el[0];
      while (parent.parentElement) {
        parent = parent.parentElement;
      }
      return parent;
    }
  });

  return showAngularStats;


  // UTILITY FUNCTIONS

  function getRootScope() {
    if ($rootScope) {
      return $rootScope;
    }
    var scopeEl = document.querySelector('.ng-scope');
    if (!scopeEl) {
      return null;
    }

    var injector = angular.element(scopeEl).injector();
    if (!injector) {
      return null;
    }

    $rootScope = injector.get('$rootScope');
    return $rootScope;
  }

  // Uses timeouts to ensure that this is only run every 300ms (it's a perf bottleneck)
  function getWatcherCount() {
    window.clearTimeout(watchCountTimeout);
    var now = timerNow();
    if (now - lastWatchCountRun > 300) {
      lastWatchCountRun = now;
      lastWatchCount = getWatcherCountForElement(angular.element(document.documentElement));
    } else {
      watchCountTimeout = window.setTimeout(function() {
        updateData(getWatcherCount());
      }, 350);
    }
    return lastWatchCount;
  }

  function getWatcherCountForElement(element) {
    var watcherCount = 0;
    if (!element || !element.length) {
      return watcherCount;
    }
    var isolateWatchers = getWatchersFromScope(element.data().$isolateScope);
    var scopeWatchers = getWatchersFromScope(element.data().$scope);
    var watchers = scopeWatchers.concat(isolateWatchers);
    watcherCount += watchers.length;
    angular.forEach(element.children(), function (childElement) {
      watcherCount += getWatcherCountForElement(angular.element(childElement));
    });
    return watcherCount;
  }

  function getWatchersFromScope(scope) {
    return scope && scope.$$watchers ? scope.$$watchers : [];
  }

  // iterate through listeners to call them with the watchCount and digestLength
  function updateData(watchCount, digestLength) {
    // update the listeners
    if (!nullOrUndef(watchCount)) {
      angular.forEach(listeners.watchCount, function(listener) {
        listener(watchCount);
      });
    }
    if (!nullOrUndef(digestLength)) {
      angular.forEach(listeners.digestLength, function(listener) {
        listener(digestLength);
      });
    }
  }

  function nullOrUndef(item) {
    return item === null || item === undefined;
  }

}));
