#!/usr/bin/env ruby

begin
  require 'coldruby'
rescue LoadError
  $: << File.join(File.dirname(__FILE__), '..')
  retry
end

def get_runtime
  runtime = ''
  Dir[File.join(File.dirname(__FILE__), '..', '..', 'runtime', '*')].sort.each do |runtime_part|
    runtime << "/* Runtime: #{runtime_part} */\n\n"
    runtime << File.read(runtime_part)
    runtime << "\n\n"
  end
  runtime
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

def compile(what, where, is_file)
  begin
    iseq = RubyVM::InstructionSequence
    if is_file
      ruby_iseq = nil
      where.each do |dir|
        file = File.join(dir, what) + '.rb'
        if File.exists? file
          ruby_iseq = iseq.compile_file file, CompilerOptions
          break
        end
      end
      ruby_iseq = iseq.compile_file what, CompilerOptions if ruby_iseq.nil?
    else
      ruby_iseq = iseq.compile what, CompilerOptions
    end
  rescue Exception => e
    print %Q{throw 'Assembly error: #{e.class.to_s}: #{e.to_s.gsub "'", "\\\\\'"}'\n}
    exit
  end

  pool = ColdRuby::Pool.new
  iseq = ColdRuby::ISeq.new(pool, ruby_iseq.to_a)

  if ColdRuby.debug
    require 'pp'

    $> = STDERR

    puts ">>>>>>>>>>>>> DISASSEMBLE"
    puts ruby_iseq.disasm
    puts

    puts ">>>>>>>>>>>>> DUMP"
    pp ruby_iseq.to_a
    puts
  end

  code = iseq.compile

  if ColdRuby.debug
    puts ">>>>>>>>>>>>> COMPILE"
    puts code
    puts

    $> = STDOUT
  end

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
  runtime = get_runtime
  puts runtime.length
  print runtime

  loop do
    trap("TERM") { exit }

    file = gets.strip
    if file == '-'
      length = gets.to_i
      code = compile(read(length), nil, false)
    else
      scope = gets.strip
      code = compile(file, JSON.parse(scope), true)
    end
    puts code.length; $>.flush
    print code; $>.flush
  end
end