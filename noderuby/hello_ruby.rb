require 'nodejs/http'
require './nodejs-rack.js'

class HelloApp
  def call(env)
    reply = <<END
<!DOCTYPE html>
<html>
<head>
  <title>Hello Rack!</title>
</head>
<body>
<h1>Hello, Rack</h1>
Rack environment: #{env.inspect}
</body>
</html>
END
    [ 200, { 'Content-Type' => 'text/html' }, [reply] ]
  end
end

Rack::Handler::NodeJS.run(HelloApp.new)
