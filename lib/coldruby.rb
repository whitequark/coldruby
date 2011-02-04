module ColdRuby
  class << self
    attr_accessor :debug
    @debug = false
  end

  VERSION = '0.1'
end

require 'coldruby/pool'
require 'coldruby/opcode'
require 'coldruby/chunk'
require 'coldruby/iseq'