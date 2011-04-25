#!/usr/bin/env ruby

require 'coldruby'

CompilerOptions = {
  :peephole_optimization    => false,
  :tailcall_optimization    => false,
  :inline_const_cache       => false,
  :specialized_instruction  => false,
  :operands_unification     => false,
  :instructions_unification => false,
  :stack_caching            => false,
}

pool = ColdRuby::Pool.new

def compile(what, where, is_file, is_toplevel=false)
  iseq = RubyVM::InstructionSequence
  if is_file
    ruby_iseq = nil
    tryload = lambda { |file, suffix|
      load = File.realpath(file + suffix)
      ruby_iseq = iseq.compile File.read(load), what+suffix, load, 1,
                  CompilerOptions
    }
    where.each do |dir|
      file = File.join(dir, what)
      if File.file? file
        tryload[file, '']
      elsif File.file?(file+'.rb')
        tryload[file, '.rb']
      else
        next
      end
      break
    end
    raise LoadError, "no such file to load: #{what}" if ruby_iseq.nil?
  else
    ruby_iseq = iseq.compile what, *where, CompilerOptions
  end

  iseq = ColdRuby::ISeq.new(pool, ruby_iseq.to_a)

  if ColdRuby.debug
    require 'pp'

    $> = STDERR

    puts ">>>>>>>>>>>>> DISASSEMBLE"
    puts ruby_iseq.disasm
    puts
  end

  code = iseq.compile

  compiled = <<-EPILOGUE
return (function(ruby) {
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

    $> = STDOUT
  end

  compiled
end

def get_runtime(directory, plaintext=false)
  runtime = []
  Dir[File.join(directory, '*')].sort.each do |runtime_file|
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
