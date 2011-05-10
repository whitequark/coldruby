require 'nodejs/http'

module Rack
  module Handler
    module NodeJS
      def self.run(app, options={})
        @options = options
        @options[:Port] ||= 80
        @options[:Host] ||= '0.0.0.0'

        @server = NodeJS::HTTP::HTTPServer.new
        yield @server if block_given?

        @server.on 'request' do |request, response|
          serve request, response, app
        end

        @server.listen(@options[:Port], @options[:Host])
      end

      def self.serve(request, response, app)
        #path, query = request.url.split('?', 2)
        path, query = request.url, ''

        env = {
          'REQUEST_METHOD' => request.method,
          'SCRIPT_NAME'    => '',
          'PATH_INFO'      => path,
          'QUERY_STRING'   => query,
          'SERVER_NAME'    => @options[:Host],
          'SERVER_PORT'    => @options[:Port],

          'rack.version'      => [1, 1],
          'rack.url_scheme'   => 'http',
          'rack.multithread'  => false,
          'rack.multiprocess' => true,
          'rack.run_once'     => false,
        }

        status, headers, body = app.call(env)

        begin
          response.writeHead(status, headers)
          body.each do |chunk|
            response.write chunk
          end
          response.end
        rescue
          body.close if body.respond_to? :close
        end
      end

      def self.shutdown
        @server.close
      end
    end
  end
end
