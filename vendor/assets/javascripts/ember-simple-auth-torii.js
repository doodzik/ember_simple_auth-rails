(function(global) {

var define, requireModule;

(function() {
  var registry = {}, seen = {};

  define = function(name, deps, callback) {
    registry[name] = { deps: deps, callback: callback };
  };

  requireModule = function(name) {
    if (seen.hasOwnProperty(name)) { return seen[name]; }
    seen[name] = {};

    if (!registry[name]) {
      throw new Error("Could not find module " + name);
    }

    var mod = registry[name],
        deps = mod.deps,
        callback = mod.callback,
        reified = [],
        exports;

    for (var i=0, l=deps.length; i<l; i++) {
      if (deps[i] === 'exports') {
        reified.push(exports = {});
      } else {
        reified.push(requireModule(resolve(deps[i])));
      }
    }

    var value = callback.apply(this, reified);
    return seen[name] = exports || value;

    function resolve(child) {
      if (child.charAt(0) !== '.') { return child; }
      var parts = child.split("/");
      var parentBase = name.split("/").slice(0, -1);

      for (var i=0, l=parts.length; i<l; i++) {
        var part = parts[i];

        if (part === '..') { parentBase.pop(); }
        else if (part === '.') { continue; }
        else { parentBase.push(part); }
      }

      return parentBase.join("/");
    }
  };

  requireModule.registry = registry;
})();

define("simple-auth-torii/authenticators/torii", 
  ["simple-auth/authenticators/base","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Base = __dependency1__["default"];

    var global = (typeof window !== 'undefined') ? window : {},
        Ember = global.Ember;

    /**
      Authenticator that wraps the
      [Torii library](https://github.com/Vestorly/torii).

      _The factory for this authenticator is registered as
      `'simple-auth-authenticator:torii'` in Ember's container._

      @class Torii
      @namespace SimpleAuth.Authenticators
      @module simple-auth-torii/authenticators/torii
      @extends Base
    */
    __exports__["default"] = Base.extend({
      /**
        @property torii
        @private
      */
      torii: null,

      /**
        @property provider
        @private
      */
      provider: null,

      /**
        Restores the session by calling the torii provider's `fetch` method.

        @method restore
        @param {Object} data The data to restore the session from
        @return {Ember.RSVP.Promise} A promise that when it resolves results in the session being authenticated
      */
      restore: function(data) {
        var _this = this;
        data      = data || {};
        return new Ember.RSVP.Promise(function(resolve, reject) {
          if (!Ember.isEmpty(data.provider)) {
            var provider = data.provider;
            _this.torii.fetch(data.provider, data).then(function(data) {
              _this.resolveWith(provider, data, resolve);
            }, function() {
              delete _this.provider;
              reject();
            });
          } else {
            delete _this.provider;
            reject();
          }
        });
      },

      /**
        Authenticates the session by opening the torii provider. For more
        documentation on torii, see the
        [project's README](https://github.com/Vestorly/torii#readme).

        @method authenticate
        @param {String} provider The provider to authenticate the session with
        @return {Ember.RSVP.Promise} A promise that resolves when the provider successfully authenticates a user and rejects otherwise
      */
      authenticate: function(provider) {
        var _this = this;
        return new Ember.RSVP.Promise(function(resolve, reject) {
          _this.torii.open(provider).then(function(data) {
            _this.resolveWith(provider, data, resolve);
          }, reject);
        });
      },

      /**
        Closes the torii provider.

        @method invalidate
        @param {Object} data The data that's stored in the session
        @return {Ember.RSVP.Promise} A promise that resolves when the provider successfully closes and rejects otherwise
      */
      invalidate: function(data) {
        var _this = this;
        return new Ember.RSVP.Promise(function(resolve, reject) {
          _this.torii.close(_this.provider).then(function() {
            delete _this.provider;
            resolve();
          }, reject);
        });
      },

      /**
        @method resolveWith
        @private
      */
      resolveWith: function(provider, data, resolve) {
        data.provider = provider;
        this.provider = data.provider;
        resolve(data);
      }

    });
  });
define("simple-auth-torii/ember", 
  ["./initializer"],
  function(__dependency1__) {
    "use strict";
    var global = (typeof window !== 'undefined') ? window : {},
        Ember = global.Ember;

    var initializer = __dependency1__["default"];

    Ember.onLoad('Ember.Application', function(Application) {
      Application.initializer(initializer);
    });
  });
define("simple-auth-torii/initializer", 
  ["simple-auth-torii/authenticators/torii","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Authenticator = __dependency1__["default"];

    __exports__["default"] = {
      name:   'simple-auth-torii',
      before: 'simple-auth',
      after:  'torii',
      initialize: function(container, application) {
        var torii         = container.lookup('torii:main');
        var authenticator = Authenticator.create({ torii: torii });
        container.register('simple-auth-authenticator:torii', authenticator, { instantiate: false });
      }
    };
  });
define('simple-auth/authenticators/base',  ['exports'], function(__exports__) {
  __exports__['default'] = global.SimpleAuth.Authenticators.Base;
});

var Authenticator = requireModule('simple-auth-torii/authenticators/torii').default;

global.SimpleAuth.Authenticators.Torii = Authenticator;

requireModule('simple-auth-torii/ember');
})((typeof global !== 'undefined') ? global : window);
