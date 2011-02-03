#!/usr/bin/env ruby

$: << './lib'

require 'commands/compile'

print get_runtime, compile(ARGV[0], %w{.}, true)