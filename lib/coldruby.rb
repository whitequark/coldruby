module ColdRuby
  @@debug = true

  def self.debug=(value)
    @@debug = value
  end

  def self.debug
    @@debug
  end

  VERSION = '0.1'
end

require 'coldruby/pool'
require 'coldruby/opcode'
require 'coldruby/chunk'
require 'coldruby/iseq'