# EmberSimpleAuth::Rails

ember-simple-auth for the assets pipeline

# IF YOU WANT A NEW VERSION RUN 
```bash
$ rake update
```
# AND SUBMIT A PULL REQUEST

## Installation

Add this line to your application's Gemfile:

    gem 'ember_simple_auth-rails'

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install ember_simple_auth-rails

## Usage

require the assets as you always do.

#### >= 0.3.0

require the base library:

```
# require "ember-simple-auth"
```

plus any extension libraries you might need:

```
# require "ember-simple-auth-cookie-store"
# require "ember-simple-auth-devise"
# require "ember-simple-auth-oauth2"
```

#### < 0.3.0

require the library:

``` 
# require "ember-simple-auth"
```

## Contributing

1. Fork it ( http://github.com/<my-github-username>/ember_simple_auth-rails/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
