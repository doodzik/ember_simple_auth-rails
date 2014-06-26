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

define("ember-simple-auth-oauth2/authenticators/oauth2", 
  ["ember-simple-auth/authenticators/base","ember-simple-auth/utils/is_secure_url","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Base = __dependency1__["default"];
    var isSecureUrl = __dependency2__["default"];

    var global = (typeof window !== 'undefined') ? window : {},
        Ember = global.Ember;

    /**
      Authenticator that conforms to OAuth 2
      ([RFC 6749](http://tools.ietf.org/html/rfc6749)), specifically the _"Resource
      Owner Password Credentials Grant Type"_.

      This authenticator supports access token refresh (see
      [RFC 6740, section 6](http://tools.ietf.org/html/rfc6749#section-6)).

      _The factory for this authenticator is registered as
      `'ember-simple-auth-authenticator:oauth2-password-grant'` in Ember's
      container._

      @class OAuth2
      @namespace Authenticators
      @extends Base
    */
    __exports__["default"] = Base.extend({
      /**
        Triggered when the authenticator refreshes the access token (see
        [RFC 6740, section 6](http://tools.ietf.org/html/rfc6749#section-6)).

        @event updated
        @param {Object} data The updated session data
      */

      /**
        The endpoint on the server the authenticator acquires the access token
        from.

        @property serverTokenEndpoint
        @type String
        @default '/token'
      */
      serverTokenEndpoint: '/token',

      /**
        Sets whether the authenticator automatically refreshes access tokens.

        @property refreshAccessTokens
        @type Boolean
        @default true
      */
      refreshAccessTokens: true,

      /**
        @property _refreshTokenTimeout
        @private
      */
      _refreshTokenTimeout: null,

      /**
        Restores the session from a set of session properties; __will return a
        resolving promise when there's a non-empty `access_token` in the `data`__
        and a rejecting promise otherwise.

        This method also schedules automatic token refreshing when there are values
        for `refresh_token` and `expires_in` in the `data` and automatic token
        refreshing is not disabled (see
        [Ember.SimpleAuth.Authenticators.OAuth2#refreshAccessTokens](#Ember-SimpleAuth-Authenticators-OAuth2-refreshAccessTokens)).

        @method restore
        @param {Object} data The data to restore the session from
        @return {Ember.RSVP.Promise} A promise that when it resolves results in the session being authenticated
      */
      restore: function(data) {
        var _this = this;
        return new Ember.RSVP.Promise(function(resolve, reject) {
          if (!Ember.isEmpty(data.access_token)) {
            var now = (new Date()).getTime();
            if (!Ember.isEmpty(data.expires_at) && data.expires_at < now) {
              if (_this.refreshAccessTokens) {
                _this.refreshAccessToken(data.expires_in, data.refresh_token).then(function(data) {
                  resolve(data);
                }, reject);
              } else {
                reject();
              }
            } else {
              _this.scheduleAccessTokenRefresh(data.expires_in, data.expires_at, data.refresh_token);
              resolve(data);
            }
          } else {
            reject();
          }
        });
      },

      /**
        Authenticates the session with the specified `credentials`; the credentials
        are `POST`ed to the `serverTokenEndpoint` (see
        [Ember.SimpleAuth.Authenticators.OAuth2#serverTokenEndpoint](#Ember-SimpleAuth-Authenticators-OAuth2-serverTokenEndpoint))
        and if they are valid the server returns an access token in response (see
        http://tools.ietf.org/html/rfc6749#section-4.3). __If the credentials are
        valid and authentication succeeds, a promise that resolves with the
        server's response is returned__, otherwise a promise that rejects with the
        error is returned.

        This method also schedules automatic token refreshing when there are values
        for `refresh_token` and `expires_in` in the server response and automatic
        token refreshing is not disabled (see
        [Ember.SimpleAuth.Authenticators.OAuth2#refreshAccessTokens](#Ember-SimpleAuth-Authenticators-OAuth2-refreshAccessTokens)).

        @method authenticate
        @param {Object} credentials The credentials to authenticate the session with
        @return {Ember.RSVP.Promise} A promise that resolves when an access token is successfully acquired from the server and rejects otherwise
      */
      authenticate: function(credentials) {
        var _this = this;
        return new Ember.RSVP.Promise(function(resolve, reject) {
          var data = { grant_type: 'password', username: credentials.identification, password: credentials.password };
          _this.makeRequest(data).then(function(response) {
            Ember.run(function() {
              var expiresAt = _this.absolutizeExpirationTime(response.expires_in);
              _this.scheduleAccessTokenRefresh(response.expires_in, expiresAt, response.refresh_token);
              resolve(Ember.$.extend(response, { expires_at: expiresAt }));
            });
          }, function(xhr, status, error) {
            Ember.run(function() {
              reject(xhr.responseJSON || xhr.responseText);
            });
          });
        });
      },

      /**
        Cancels any outstanding automatic token refreshes and returns a resolving
        promise.

        @method invalidate
        @return {Ember.RSVP.Promise} A resolving promise
      */
      invalidate: function() {
        Ember.run.cancel(this._refreshTokenTimeout);
        delete this._refreshTokenTimeout;
        return new Ember.RSVP.resolve();
      },

      /**
        Sends an `AJAX` request to the `serverTokenEndpoint`. This will always be a
        _"POST_" request with content type _"application/x-www-form-urlencoded"_ as
        specified in [RFC 6749](http://tools.ietf.org/html/rfc6749).

        This method is not meant to be used directly but serves as an extension
        point to e.g. add _"Client Credentials"_ (see
        [RFC 6749, section 2.3](http://tools.ietf.org/html/rfc6749#section-2.3)).

        @method makeRequest
        @param {Object} data The data to send with the request, e.g. username and password or the refresh token
        @return {Deferred object} A Deferred object (see [the jQuery docs](http://api.jquery.com/category/deferred-object/)) that is compatible to Ember.RSVP.Promise; will resolve if the request succeeds, reject otherwise
        @protected
      */
      makeRequest: function(data) {
        if (!isSecureUrl(this.serverTokenEndpoint)) {
          Ember.Logger.warn('Credentials are transmitted via an insecure connection - use HTTPS to keep them secure.');
        }
        return Ember.$.ajax({
          url:         this.serverTokenEndpoint,
          type:        'POST',
          data:        data,
          dataType:    'json',
          contentType: 'application/x-www-form-urlencoded'
        });
      },

      /**
        @method scheduleAccessTokenRefresh
        @private
      */
      scheduleAccessTokenRefresh: function(expiresIn, expiresAt, refreshToken) {
        var _this = this;
        if (this.refreshAccessTokens) {
          var now = (new Date()).getTime();
          if (Ember.isEmpty(expiresAt) && !Ember.isEmpty(expiresIn)) {
            expiresAt = new Date(now + expiresIn * 1000).getTime();
          }
          var offset = (Math.floor(Math.random() * 15) + 5) * 1000;
          if (!Ember.isEmpty(refreshToken) && !Ember.isEmpty(expiresAt) && expiresAt > now - offset) {
            Ember.run.cancel(this._refreshTokenTimeout);
            delete this._refreshTokenTimeout;
            if (!Ember.testing) {
              this._refreshTokenTimeout = Ember.run.later(this, this.refreshAccessToken, expiresIn, refreshToken, expiresAt - now - offset);
            }
          }
        }
      },

      /**
        @method refreshAccessToken
        @private
      */
      refreshAccessToken: function(expiresIn, refreshToken) {
        var _this = this;
        var data  = { grant_type: 'refresh_token', refresh_token: refreshToken };
        return new Ember.RSVP.Promise(function(resolve, reject) {
          _this.makeRequest(data).then(function(response) {
            Ember.run(function() {
              expiresIn     = response.expires_in || expiresIn;
              refreshToken  = response.refresh_token || refreshToken;
              var expiresAt = _this.absolutizeExpirationTime(expiresIn);
              var data      = Ember.$.extend(response, { expires_in: expiresIn, expires_at: expiresAt, refresh_token: refreshToken });
              _this.scheduleAccessTokenRefresh(expiresIn, null, refreshToken);
              _this.trigger('sessionDataUpdated', data);
              resolve(data);
            });
          }, function(xhr, status, error) {
            Ember.Logger.warn('Access token could not be refreshed - server responded with ' + error + '.');
            reject();
          });
        });
      },

      /**
        @method absolutizeExpirationTime
        @private
      */
      absolutizeExpirationTime: function(expiresIn) {
        if (!Ember.isEmpty(expiresIn)) {
          return new Date((new Date().getTime()) + (expiresIn - 5) * 1000).getTime();
        }
      }
    });
  });
define("ember-simple-auth-oauth2/authorizers/oauth2", 
  ["ember-simple-auth/authorizers/base","ember-simple-auth/utils/is_secure_url","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Base = __dependency1__["default"];
    var isSecureUrl = __dependency2__["default"];

    var global = (typeof window !== 'undefined') ? window : {},
        Ember = global.Ember;

    /**
      Authorizer that conforms to OAuth 2
      ([RFC 6749](http://tools.ietf.org/html/rfc6749)) by sending a bearer token
      ([RFC 6749](http://tools.ietf.org/html/rfc6750)) in the request's
      `Authorization` header.

      _The factory for this authorizer is registered as
      `'ember-simple-auth-authorizer:oauth2-bearer'` in Ember's container._

      @class OAuth2
      @namespace Authorizers
      @extends Base
    */
    __exports__["default"] = Base.extend({
      /**
        Authorizes an XHR request by sending the `access_token` property from the
        session as a bearer token in the `Authorization` header:

        ```
        Authorization: Bearer <access_token>
        ```

        @method authorize
        @param {jqXHR} jqXHR The XHR request to authorize (see http://api.jquery.com/jQuery.ajax/#jqXHR)
        @param {Object} requestOptions The options as provided to the `$.ajax` method (see http://api.jquery.com/jQuery.ajaxPrefilter/)
      */
      authorize: function(jqXHR, requestOptions) {
        var accessToken = this.get('session.access_token');
        if (this.get('session.isAuthenticated') && !Ember.isEmpty(accessToken)) {
          if (!isSecureUrl(requestOptions.url)) {
            Ember.Logger.warn('Credentials are transmitted via an insecure connection - use HTTPS to keep them secure.');
          }
          jqXHR.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        }
      }
    });
  });
define('ember-simple-auth/authenticators/base',  ['exports'], function(__exports__) {
  __exports__['default'] = global.Ember.SimpleAuth.Authenticators.Base;
});
define('ember-simple-auth/authorizers/base',  ['exports'], function(__exports__) {
  __exports__['default'] = global.Ember.SimpleAuth.Authorizers.Base;
});
define('ember-simple-auth/utils/is_secure_url',  ['exports'], function(__exports__) {
  __exports__['default'] = global.Ember.SimpleAuth.Utils.isSecureUrl;
});

var Authenticator = requireModule('ember-simple-auth-oauth2/authenticators/oauth2').default;
var Authorizer = requireModule('ember-simple-auth-oauth2/authorizers/oauth2').default;

global.Ember.SimpleAuth.Authenticators.OAuth2 = Authenticator;
global.Ember.SimpleAuth.Authorizers.OAuth2    = Authorizer;

global.Ember.SimpleAuth.initializeExtension(function(container, application, options) {
  container.register('ember-simple-auth-authorizer:oauth2-bearer', global.Ember.SimpleAuth.Authorizers.OAuth2);
  container.register('ember-simple-auth-authenticator:oauth2-password-grant', global.Ember.SimpleAuth.Authenticators.OAuth2);
});
})((typeof global !== 'undefined') ? global : window);
