require "bundler/gem_tasks"

task :update do
	if system("grunt --version") && system("npm --version") && system("git --version")

		Dir.mkdir "tmp"
	
		`git clone https://github.com/simplabs/ember-simple-auth.git`
		Dir.chdir "ember-simple-auth"
		`npm install`
		`grunt dist`
		
		paths = `find ./tmp -not -regex '.*.amd.js' -and -regex '.*.js'  -maxdepth 1`.split
		paths.map {|path| FileUtils.mv path, "../vendor/assets/javascripts" }

		version = `git tag`.split.last

		Dir.chdir ".."
		FileUtils.remove_dir "tmp", true	
		FileUtils.remove_dir "ember-simple-auth", true	
		
		version_file = "lib/ember_simple_auth/rails/version.rb";
		new_content = File.open(version_file, "r") { |out| out.read.gsub(/(\d+)\.(\d+)\.(\d+)/, version) }
		File.open(version_file, 'w') { |file| file.write(new_content) }
		
		`git add -A`
		`git commit -am 'update to #{version}'`
		`git tag #{version}`

		`gem build ember_simple_auth-rails.gemspec`
	end
end

task :publish do
	`git push --tags`
	`git push --follow-tags`
	version = `git tag`.split.last
	`gem push ember_simple_auth-rails-#{version}.gem`
end

