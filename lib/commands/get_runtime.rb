#!/usr/bin/env ruby

def get_runtime
  runtime = ''
  Dir[File.join(File.dirname(__FILE__), '..', '..', 'runtime', '*')].sort.each do |runtime_part|
    runtime << "/* Runtime: #{runtime_part} */\n\n"
    runtime << File.read(runtime_part)
    runtime << "\n\n"
  end
  runtime
end

if __FILE__ == $0
  print get_runtime
end