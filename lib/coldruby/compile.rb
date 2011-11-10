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

  case epilogue
    when 'nodejs'
      compiled = <<END
var ruby = require('ruby');
require('ruby/nodejs');

ruby.protect_node(function() {
END
    when 'qtscript'
      compiled = <<END
ruby.protect(function() {
END
    else
      compiled = ""
  end

  compiled.concat <<-CODE
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
    when 'global-ruby', 'browser'
      compiled << '})(ruby);'
    when 'nodejs'
      compiled << <<END
})(ruby);
})();
END
    when 'qtscript'
      compiled << <<END
})(ruby);
}, function(e) {
  qtPrintRubyError(e);
});
END
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

CONSOLE_LOG_PUTS = <<-CODE
$.define_method($c.Kernel, "puts", -1, function(self, args) {
  if(args.length < 1)
    args.push("");
  args = this.to_ary(args);

  for(var i = 0; i < args.length; i++)
    console.log(this.to_str(args[i]).value);

  return Qnil;
});
CODE

def get_runtime(directory, epilogue_type=nil)
  runtime = []
  Dir[File.join(directory, '*.js')].sort.each do |runtime_file|
    # Preprocess
    lines = File.readlines(runtime_file)
    lines.unshift %Q{"use strict";\n}

    basename = File.basename(runtime_file).inspect

    last_definition = nil
    vars = {}
    lines.each_with_index { |line, index|
      if line =~ %r{^\$\.define_method\(}
        last_definition = index
      elsif line =~ %r{\s+var ([a-z_]+)}
        vars[$1] = index
      elsif last_definition && line == "});\n"
        lines[index] = "}, { file: #{basename}, line: #{last_definition + 1} });\n"
      elsif line =~ %r{this.lambda\(([a-z_]+),}
        var = $1
        line.sub! %r{(this.lambda\(#{var}, -?\d+)\)}, "\\1, { file: #{basename}, line: #{vars[var] + 1} }, #{var.inspect})" if vars[var]
      end
    }

    runtime << [ File.basename(runtime_file), lines.join ]
  end

  epilogue = ""
  case epilogue_type
    when 'global-ruby'
      epilogue << "ruby = $.create_ruby();\n"
    when 'nodejs'
      epilogue << "module.exports = $.create_ruby();\n"
      epilogue << CONSOLE_LOG_PUTS
    when 'browser'
      epilogue << "ruby = $.create_ruby();\n"
      epilogue << CONSOLE_LOG_PUTS
    when nil, 'qtscript'
    else
      raise "Unknown epilogue type #{epilogue}"
  end

  runtime << [ "<internal:epilogue>", epilogue ]

  runtime
end
