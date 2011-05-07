server = NodeJS::Server.new do |req, resp|
  resp.writeHead 200, { 'Content-Type' => 'text/plain', 'X-Header' => 'test' }
  resp.write "Hello from ruby"
  resp.end
end

server.listen(1337, '127.0.0.1')

puts "Listening at localhost:1337..."
