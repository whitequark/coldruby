#!/usr/bin/env ruby

puts "Simple REPL. No line editing is supported. Exit with ^D."

loop do
  print ">> "

  input = gets
  break if input.nil?

  begin
    puts "=> #{eval(input).inspect}"
#  rescue Exception => e
#    puts "#{e.class.name}: #{e.message}"
#    e.backtrace.each { |line| puts "\t#{line}" }
  end
end

puts