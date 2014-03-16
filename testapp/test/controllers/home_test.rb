require 'test_helper'
class TestAdd < ActiveSupport::TestCase
  def test_add
    haystack = Rails.application.assets.find_asset('ember-simple-auth.js').to_s
    needleName = 'define("ember-simple-auth'
    assert haystack.include?(needleName), 'has ember-simple-auth in the assets'
  end
end