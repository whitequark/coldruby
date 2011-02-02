#!/usr/bin/env ruby

$: << './lib'

require 'commands/compile'
require 'commands/get_runtime'

print get_runtime, compile(ARGV[0], %w{.}, true)