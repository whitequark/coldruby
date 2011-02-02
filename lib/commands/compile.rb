#!/usr/bin/env ruby

begin
  require 'coldruby'
rescue LoadError
  $: << File.join(File.dirname(__FILE__), '..', 'lib')
  retry
end

CompilerOptions = {
  :peephole_optimization    => false,
  :tailcall_optimization    => false,
  :inline_const_cache       => false,
  :specialized_instruction  => false,
  :operands_unification     => false,
  :instructions_unification => false,
  :stack_caching            => false,
}

def compile(file)
  $stderr.puts "Compiling #{file}"

  begin
    ruby_iseq = RubyVM::InstructionSequence.compile_file file, CompilerOptions
  rescue Exception => e
    print %Q{throw "Assembly error: #{e.class.to_s}: #{e}"\n}
    exit
  end

  if ColdRuby.debug
    require 'pp'

    puts ">>>>>>>>>>>>> DISASSEMBLE"
    puts ruby_iseq.disasm
    puts

    puts ">>>>>>>>>>>>> DUMP"
    pp ruby_iseq.to_a
    puts

    puts ">>>>>>>>>>>>> COMPILE"
  end

  pool = ColdRuby::Pool.new
  iseq = ColdRuby::ISeq.new(pool, ruby_iseq.to_a)

  code = iseq.compile

  compiled = <<-EPILOGUE
var iseq = #{code};

var new_symbols = #{pool.symbols};
for(var k in new_symbols) {
  $.symbols[k] = parseInt($.text2sym(new_symbols[k]).value);
}

var context = $.create_context();
var toplevel = $.create_toplevel();
var sf_opts = {
  self: toplevel,
  ddef: toplevel,
  cref: [$c.Object],
};
$.execute(context, sf_opts, iseq, []);
  EPILOGUE

  compiled
end

if __FILE__ == $0
  print compile(ARGV[0])
end