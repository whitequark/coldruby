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

def compile(code, file, line)
  ruby_iseq = RubyVM::InstructionSequence.compile code, file, nil, line, CompilerOptions

  pool = ColdRuby::Pool.new
  iseq = ColdRuby::ISeq.new(pool, ruby_iseq.to_a)

  if ColdRuby.debug
    puts ">>>>>>>>>>>>> DISASSEMBLE"
    puts ruby_iseq.disasm
    puts
  end

  code = iseq.compile

  compiled = <<-EPILOGUE
(function(ruby) {
  var iseq = #{code};

  var new_symbols = #{pool.symbols};
  for(var k in new_symbols) {
    ruby.symbols[k] = parseInt(ruby.text2sym(new_symbols[k]).value);
  }

  var sf_opts = {
    self: ruby.toplevel,
    ddef: ruby.toplevel,
    cref: [ruby.c.Object],
  };

  ruby.execute(sf_opts, iseq, []);
});
  EPILOGUE

  if ColdRuby.debug
    puts ">>>>>>>>>>>>> COMPILE"
    puts compiled
    puts
  end

  compiled
end

def get_runtime(directory, plaintext=false)
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

    if plaintext
      runtime_part = ''
      runtime_part << "/* Runtime: #{runtime_file} */\n\n" if plaintext
      runtime_part << lines.join
      runtime_part << "\n\n"
      runtime << runtime_part
    else
      runtime << [File.basename(runtime_file), lines.join]
    end
  end
  runtime
end
