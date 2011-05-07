server = NodeJS::HTTP::Server.new

server.on 'request' do |req, resp|
  resp.write "Request http version: #{req.http_version}\n"
  resp.write "Request method: #{req.method}\n"
  resp.write "Request URL: #{req.url}\n"
  resp.write "Request headers:\n"
  req.headers.each do |header, value|
    resp.write "  #{header}: #{value}\n"
  end
  resp.end
end

server.listen(1337, '127.0.0.1')

puts "Listening at localhost:1337..."
