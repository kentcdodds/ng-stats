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

  // check for autoload
  var autoloadOptions = sessionStorage[autoloadKey];
  if (autoloadOptions) {
    autoload(JSON.parse(autoloadOptions));
  }

  function autoload(options) {
    if (window.angular && angular.element(document.body).injector()) {
      showAngularStats(options);
    } else {
      // wait for angular to load...
      window.setTimeout(function() {
        autoload(options);
      },1000);
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

    // setup the state
    var state = current = { active:true };

    // auto-load on startup
    if (opts.autoload) {
      sessionStorage.setItem(autoloadKey,JSON.stringify(opts));
    } else {
      sessionStorage.removeItem(autoloadKey);
    }

    // define the timer function to use based upon whether or not 'performance is available'
    var timerNow = window.performance
      ? function() { return performance.now(); }
      : function() { return Date.now(); };

    // general variables
    var sum = 0;
    var times = [0,0,0,0];
    var timesIdx = 0;
    var noDigestSteps = 0;
    var bodyEl = angular.element(document.body);

    // add the DOM element
    state.$el = angular.element('<div><canvas></canvas><div></div></div>').css({
      position: 'fixed',
      background: 'black',
      borderBottom: '1px solid #666',
      borderRight: '1px solid #666',
      color: 'red',
      paddingRight: 8,
      paddingLeft: 8,
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
    var $scope = bodyEl.injector().get('$rootScope');
    var $digest = $scope.__proto__.$digest;
    $scope.__proto__.$digest = function() {
      var start = timerNow();

      // call the original digest
      $digest.apply(this,arguments);

      // update the timing
      var diff = (timerNow()-start);
      sum = sum - times[timesIdx] + diff;
      times[timesIdx] = diff;
      timesIdx = (timesIdx+1)%times.length;

      // display the results
      var avg = (sum/times.length);
      var color = (avg>opts.digestTimeThreshold) ? 'red' : 'green';
      $text.text(getWatcherCount() + ' | ' + avg.toFixed(2)).css({color:color});

      // color the sliver if this is the first step
      var ctx = cvs.getContext('2d');
      if (noDigestSteps > 0) {
        noDigestSteps = 0;
        ctx.fillStyle = '#333';
        ctx.fillRect(graphSz.width-1,0,1,graphSz.height);
      }

      // mark the point on the graph
      ctx.fillStyle = color;
      ctx.fillRect(graphSz.width-1,Math.max(0,graphSz.height-avg),2,2);
    };

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

    function getWatcherCount() {
      var root = angular.element(document.getElementsByTagName('body'));
      var watcherCount = 0;

      function getWatchers(element) {
        if (element.data().hasOwnProperty('$scope')) {
          var watchers = element.data().$scope.$$watchers || [];
          watcherCount += watchers.length;
        }
        angular.forEach(element.children(), function (childElement) {
          getWatchers(angular.element(childElement));
        });
      }

      getWatchers(root);

      return watcherCount;
    }

    // start everything
    shiftLeft();
    $scope.$digest();
  }

  return showAngularStats;
}));
