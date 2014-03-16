# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'ember_simple_auth/rails/version'

Gem::Specification.new do |spec|
  spec.name          = "ember_simple_auth-rails"
  spec.version       = EmberSimpleAuth::Rails::VERSION
  spec.authors       = ["frederik dudzik"]
  spec.email         = ["4004blog@gmail.com"]
  spec.summary       = "ember-simple-auth for the rails asset pipeline"
  spec.homepage      = "https://github.com/doodzik/ember_simple_auth-rails"
  spec.license       = "MIT"

  spec.files         = Dir["{lib,vendor}/**/*"] + ["LICENSE.txt", "README.md"]
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 1.5"
  spec.add_development_dependency "rake"
  spec.add_dependency "railties", "> 3.1"
end
