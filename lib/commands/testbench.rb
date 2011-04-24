#!/usr/bin/env ruby

$: << './lib'

require 'commands/compile'

print get_runtime(true).join, compile(ARGV[0], %w{.}, true)
