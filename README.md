# ng-stats

Little utility to show stats about your page's angular digest/watches.

Example Green (digests are running smoothly):

![Example Green](http://cl.ly/image/2H1X2Q222i0F/ng-stats-good.png)

Example Red (digests are taking a bit...):

![Example Red](http://cl.ly/image/2f3L1B3b1q2V/ng-stats-bad.png)

The first number is the number of watchers on the page (including `{{variables}}`, `$scope.$watch`, etc.). The second number is how long (in milliseconds) it takes angular to go through each digest cycle on average (bigger is worse). The graph shows a trend of the digest cycle average time.

## Install and use

`$ npm|bower install ng-stats`

or download `ng-stats.js` and

`<script src="path-to-ng-stats"></script>`

```javascript
var showAngularStats = require('path-to-ng-stats'); // if using commonjs or amd otherwise it's global with that name
showAngularStats(options);
```

## Options

You can pass the function one (optional) argument. If you pass `false` it will turn off "autoload" and do nothing. You can also pass an object with other options:

### position (object) - default: `'topleft'`

Controls the position of the graphic.
Possible values: Any combination of `top`, `left`, `right`, `bottom`.

### digestTimeThreshold (number) - default: 16

The time (in milliseconds) where it goes from red to green.

### autoload (boolean) - default: false

Uses sessionStorage to store whether the graphic should be automatically loaded every time the page is reloaded.

## License

MIT

## Thanks

[Viper Bailey](https://github.com/jinxidoru) for writing the initial version (and most of what the project is today).