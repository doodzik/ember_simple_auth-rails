require 'test_helper'
class TestAdd < ActiveSupport::TestCase
  def test_asset_main
    haystack = Rails.application.assets.find_asset('ember-simple-auth.js').to_s
    needleName = 'define("ember-simple-auth'
    assert haystack.include?(needleName), 'has ember-simple-auth in the assets'
  end
  def test_asset_auth_coockie_store
    haystack = Rails.application.assets.find_asset('ember-simple-auth-cookie-store.js').to_s
    needleName = 'define("ember-simple-auth-cookie-store",'
    assert haystack.include?(needleName), 'has ember-simple-auth-cookie-store in the assets'
  end
  def test_asset_auth_devise
    haystack = Rails.application.assets.find_asset('ember-simple-auth-devise.js').to_s
    needleName = 'define("ember-simple-auth-devise'
    assert haystack.include?(needleName), 'has ember-simple-auth-devise in the assets'
  end
  def test_asset_auth
    haystack = Rails.application.assets.find_asset('ember-simple-auth-oauth2.js').to_s
    needleName = 'define("ember-simple-auth-oauth2'
    assert haystack.include?(needleName), 'has ember-simple-auth-oauth2 in the assets'
  end
end