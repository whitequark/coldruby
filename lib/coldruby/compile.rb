#!/usr/bin/env ruby

require 'coldruby'

$> = STDERR

CompilerOptions = {
  :peephole_optimization    => false,
  :tailcall_optimization    => false,
  :inline_const_cache       => false,
  :specialized_instruction  => false,
  :operands_unification     => false,
  :instructions_unification => false,
  :stack_caching            => false,
}

def compile(code, file, line, epilogue=nil)
  ruby_iseq = RubyVM::InstructionSequence.compile code, file, nil, line, CompilerOptions

  pool = ColdRuby::Pool.new
  iseq = ColdRuby::ISeq.new(pool, ruby_iseq.to_a)

  if ColdRuby.debug
    puts ">>>>>>>>>>>>> DISASSEMBLE"
    puts ruby_iseq.disasm
    puts
  end

  code = iseq.compile

  compiled = <<-CODE
(function(ruby) {
  var symbols = {};
  var local_symbols = #{pool.symbols};
  for(var k in local_symbols) {
    symbols[k] = parseInt(ruby.text2sym(local_symbols[k]).value);
  }

  var iseq = #{code};

  var sf_opts = {
    self: ruby.toplevel,
    ddef: ruby.toplevel,
    cref: [ruby.c.Object],
  };

  ruby.execute(sf_opts, iseq, []);
  CODE

  case epilogue
    when 'global-ruby'
      compiled << '})(ruby);'
    when nil
      compiled << '});'
    else
      raise "Unknown epilogue type #{epilogue}"
  end

  if ColdRuby.debug
    puts ">>>>>>>>>>>>> COMPILE"
    puts compiled
    puts
  end

  compiled
end

def get_runtime(directory, epilogue=nil)
  runtime = []
  Dir[File.join(directory, '*.js')].sort.each do |runtime_file|
    # Preprocess
    lines = File.readlines(runtime_file)
    last_definition = nil
    lines.each_with_index { |line, index|
      if line =~ %r{^\$\.define_method\(}
        last_definition = index
      elsif last_definition && line == "});\n"
        lines[index] = "}, { file: #{File.basename(runtime_file).inspect}," <<
                       " line: #{last_definition + 1} });\n"
      end
    }

    runtime_part = ''
    runtime_part << "/* Runtime: #{runtime_file} */\n\n" if plaintext
    runtime_part << lines.join
    runtime_part << "\n\n"
    runtime << runtime_part

    case epilogue
      when 'global-ruby'
        runtime << "ruby = $.create_ruby();"
      when nil
      else
        raise "Unknown epilogue type #{epilogue}"
    end
  end
  runtime.join
end
