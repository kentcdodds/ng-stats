import _ from 'lodash';
import angular from 'angular';
import showAngularStats from './index';
describe(`ng-stats`, () => {

  describe(`function`, () => {
    // TODO...
    it(`should expose give me a function I can call`, () => {
      expect(showAngularStats).to.be.a('function');
    });
  });

  describe('angular-stats', () => {
    let $injector;
    let $compile, scope, el, node, appNode;
    let basicTemplate = `
      <div angular-stats watch-count=".watch-count" digest-length=".digest-length"
           on-watch-count-update="onWatchCountUpdate(watchCount)"
           on-digest-length-update="onDigestLengthUpdate(digestLength)">
        Watch Count: <span class="watch-count"></span><br />
        Digest Cycle Length: <span class="digest-length"></span>
      </div>
    `;

    beforeEach(() => {
      appNode = document.createElement('div');
      document.body.appendChild(appNode);
      angular.module('app', ['angularStats']);
      $injector = angular.bootstrap(appNode, ['app']);
      $compile = $injector.get('$compile');
      scope = $injector.get('$rootScope').$new();
      scope.onWatchCountUpdate = function(count) {
        scope.onWatchCountUpdate.invokes.push(arguments);
      };
      scope.onWatchCountUpdate.invokes = [];
      scope.onDigestLengthUpdate = function(digestLength) {
        scope.onDigestLengthUpdate.invokes.push(arguments);
      };
      scope.onDigestLengthUpdate.invokes = [];
    });

    it(`invoke on-digest-length-update and update the node`, () => {
      compileAndDigest();
      const digestLengthNode = node.querySelector('.digest-length');

      expect(scope.onDigestLengthUpdate.invokes).to.have.length(1);
      nodeContentSameAsLatestValue(digestLengthNode, scope.onDigestLengthUpdate);

      scope.$digest();

      expect(scope.onDigestLengthUpdate.invokes).to.have.length(2);
      nodeContentSameAsLatestValue(digestLengthNode, scope.onDigestLengthUpdate);
    });

    // not sure what's up with this. I think it has to do with the 350ms timeout on updating the watch count...
    it.skip(`should invoke on-watch-count-update`, () => {
      compileAndDigest();
      const watchCountNode = node.querySelector('.watch-count');

      expect(scope.onWatchCountUpdate.invokes).to.have.length(1);
      nodeContentSameAsLatestValue(watchCountNode, scope.onWatchCountUpdate);

      scope.$digest();

      expect(scope.onWatchCountUpdate.invokes).to.have.length(2);
      nodeContentSameAsLatestValue(watchCountNode, scope.onWatchCountUpdate);
    });

    afterEach(() => {
      appNode.remove();
    });

    function compileAndDigest(template, extraProps = {}) {
      _.assign(scope, extraProps);
      el = $compile(template || basicTemplate)(scope);
      node = el[0];
      scope.$digest();
    }

    function nodeContentSameAsLatestValue(theNode, tracker) {
      const nodeNumber = parseFloat(theNode.textContent);
      const latestInvoke = parseFloat(getLatestFirstArg(tracker).toFixed(2));
      expect(nodeNumber).to.equal(latestInvoke);
    }

    function getLatestFirstArg(invokeable) {
      return invokeable.invokes[invokeable.invokes.length - 1][0];
    }
  });
});

