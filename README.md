# ng-stats

[![npm version](https://img.shields.io/npm/v/ng-stats.svg?style=flat-square)](https://www.npmjs.org/package/ng-stats)
[![npm downloads](https://img.shields.io/npm/dm/ng-stats.svg?style=flat-square)](http://npm-stat.com/charts.html?package=ng-stats&from=2015-01-01)
[![Build Status](https://snap-ci.com/kentcdodds/ng-stats/branch/master/build_image)](https://snap-ci.com/kentcdodds/ng-stats/branch/master)
[![Code Coverage](https://img.shields.io/codecov/c/github/kentcdodds/ng-stats.svg?style=flat-square)](https://codecov.io/github/kentcdodds/ng-stats)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/kentcdodds/ng-stats?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Little utility to show stats about your page's angular digest/watches. This library currently has a simple script to
produce a chart (see below). It also creates a module called `angularStats` which has a directive called `angular-stats`
which can be used to put angular stats on a specific place on the page that you specify.

Example Green (digests are running smoothly):

![Example Green](http://cl.ly/image/2H1X2Q222i0F/ng-stats-good.png)

Example Red (digests are taking a bit...):

![Example Red](http://cl.ly/image/2f3L1B3b1q2V/ng-stats-bad.png)

[Interactive Demo](http://kent.doddsfamily.us/ng-stats)

The first number is the number of watchers on the page (including `{{variables}}`, `$scope.$watch`, etc.). The second
number is how long (in milliseconds) it takes angular to go through each digest cycle on average (bigger is worse). The
graph shows a trend of the digest cycle average time.

## Development

1. `npm install`
2. `bower install`
3. `grunt` for server
4. `grunt release` for release

## Installation

### Bookmarklet

Copy the code below and create a bookmarklet for ng-stats to use it on any angular website (so long as the debug info is
enabled, if not, you'll need to run `angular.reloadWithDebugInfo()` first).

```javascript
javascript: (function() {var a = document.createElement("script");a.src = "https://rawgithub.com/kentcdodds/ng-stats/master/src/ng-stats.js";a.onload=function(){window.showAngularStats()};document.head.appendChild(a)})();
```

If you just want the chart for development purposes, it's actually easiest to use as a
[Chrome DevTools Snippet](https://developer.chrome.com/devtools/docs/authoring-development-workflow#snippets).
Just copy/paste the `ng-stats.js` file into a snippet.

However, it uses UMD, so you can also include it in your app if you want via:

`$ npm|bower install ng-stats`

or download `ng-stats.js` and

`<script src="path-to/ng-stats.js"></script>`

or

```javascript
var showAngularStats = require('path-to-ng-stats');
```

You now have a `angularStats` module and `showAngularStats` function you can call

## Chart

### Usage

Simply invoke `showAngularStats( { options } )` and the chart will appear. It also returns an object with a few handy
things depending on your options. One of these things is `listeners` which is an object that has two objects:
`digestLength` and `watchCount`. You can add a custom listener that is called when the digest cycles happen (though
for performance reasons when calculating the watchCount, the `watchCount` listeners are throttled). Here's an example
of adding custom listeners:

```javascript
var ngStats = showAngularStats();

ngStats.listeners.digestLength.nameOfYourListener = function(digestLength) {
  console.log('Digest: ' + digestLength);
};

ngStats.listeners.watchCount.nameOfYourListener = function(watchCount) {
  console.log('Watches: ' + watchCount);
};
```

### Options

You can pass the function one (optional) argument. If you pass `false` it will turn off "autoload" and do nothing. You can also pass an object with other options:

#### position (object) - default: `'topleft'`

Controls the position of the graphic.
Possible values: Any combination of `top`, `left`, `right`, `bottom`.

#### digestTimeThreshold (number) - default: 16

The time (in milliseconds) where it goes from red to green.

#### autoload (string or boolean) - default: false

Uses the [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage) to store whether the graphic should be automatically loaded every time the page is reloaded.  Pass in `'localStorage'` for persistent loading or `'sessionStorage'` to load ng-stats for only the current session.

Note, if you pass `false` as options, it will simply remove the stats window and exit: `showAngularStats(false)`

#### trackDigest (boolean) - default: false

`showAngularStats` returns an object. Setting this to true will add an array to that object called `digest` that holds
all of the digest lengths.

#### trackWatches (boolean) - default: false

`showAngularStats` returns an object. Setting this to true will add an array to that object called `watches` that holds
all of the watch counts as they change.

#### logDigest (boolean) - default: false

Setting this to true will cause ng-stats to log out the digest lengths to the console. It will be colored green or red
based on the digestTimeThreshold.

#### logWatches (boolean) - default: false

Setting this to true will cause ng-stats to log out the watch count to the console as it changes.

#### htmlId (string) - default: null

Sets an HTML ID attribute to the rendered stats element.

## Module

Simply declare it as a dependency `angular.module('your-mod', ['angularStats']);`

Then use the directive:

```
<div angular-stats watch-count=".watch-count" digest-length=".digest-length"
     on-watch-count-update="onWatchCountUpdate(watchCount)"
     on-digest-length-update="onDigestLengthUpdate(digestLength)">
  Watch Count: <span class="watch-count"></span><br />
  Digest Cycle Length: <span class="digest-length"></span>
</div>
```

### angular-stats attributes

#### angular-stats

The directive itself. No value is expected

#### watch-count

Having this attribute will keep track of the watch count and update the `text` of a specified element.
Possible values are:

1. Selector for a child element to update
2. no value - refers to the current element (updates the text of the current element)

#### watch-count-root

`angular-stats` defaults to keeping track of the watch count for the whole page, however if you want to keep track of a
specific element (and its children), provide this with a element query selector. As a convenience, if `this` is provided
then the `watch-count-root` will be set to the element itself. Also, if you want to scope the query selector to the
element, add `watch-count-of-child` as an attribute (no value)

#### on-watch-count-update

Because of the performance implications of calculating the watch count, this is not called every digest but a maximum
of once every 300ms. Still avoid invoking another digest here though. The name of the variable passed is `watchCount`
(like you see in the example).

#### digest-length

This works similar to the `watch-count` attribute. It's presence will cause the directive to keep track of the
`digest-length` and will update the `text` of a specified element (rounds to two decimal places). Possible values are:

1. Selector for a child element to update
2. no value - refers to the current element (updates the text of the current element)

#### on-digest-length-update

Pass an expression to evaluate with every digest length update. This gets called on every digest (so be sure you don't
invoke another digest in this handler or you'll get an infinite loop of doom). The name of the variable passed is
`digestLength` (as in the example).

## Roadmap

- Add analysis to highlight areas on the page that have highest watch counts.
- Somehow find out which watches are taking the longest... Ideas on implementation are welcome...
- See what could be done with the new scoped digest coming in Angular version 1.3.
- Count the number of digests or provide some analytics for frequency?
- Create a Chrome Extension for the chart or integrate with [batarang](https://github.com/angular/angularjs-batarang)?
- Other ideas?

## Other notes

### Performance impact

This will not impact the speed of your application at all until you actually use it. It also will hopefully only
negatively impact your app's performance minimally. This is intended to be used in development only for debugging
purposes so it shouldn't matter much anyway. It should be noted that calculating the watch count can be pretty
expensive, so it's throttled to be calculated a minimum of 300ms.

### Using in an iframe

Thanks to [this brilliant PR](https://github.com/kentcdodds/ng-stats/pull/25) from
[@jinyangzhen](https://github.com/jinyangzhen), you can run ng-stats in an iframe (like plunker!). See the PR for
an example of how to accomplish this.

## License

MIT

## Thanks

[Viper Bailey](https://github.com/jinxidoru) for writing the initial version (and most of the graph stuff).
