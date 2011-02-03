#!/usr/bin/env ruby

begin
  require 'coldruby'
rescue LoadError
  $: << File.join(File.dirname(__FILE__), '..')
  retry
end

def get_runtime(plaintext=false)
  runtime = []
  Dir[File.join(File.dirname(__FILE__), '..', '..', 'runtime', '*')].sort.each do |runtime_file|
    if plaintext
      runtime_part = ''
      runtime_part << "/* Runtime: #{runtime_file} */\n\n" if plaintext
      runtime_part << File.read(runtime_file)
      runtime_part << "\n\n"
      runtime << runtime_part
    else
      runtime << [File.basename(runtime_file), File.read(runtime_file)]
    end
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
      ruby_iseq = iseq.compile what, *where, CompilerOptions
    end
  rescue Exception => e
    return %Q{throw 'Assembly error: #{e.class.to_s}: #{e.to_s.gsub "'", "\\\\\'"}'\n}
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

  compiled = <<-EPILOGUE
(function() {
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
  $.protect(context, function() {
    $.execute(context, sf_opts, iseq, []);
  }, function(e) {
    if(e.klass) {
      var message   = $.invoke_method(this, e, 'message',   []);
      var backtrace = $.invoke_method(this, e, 'backtrace', []);
      $i.print(e.klass.klass_name + ": " + message + "\\n");
      for(var i = backtrace.length - 1; i >= 0; i--) {
        $i.print("\tfrom " + backtrace[i] + "\\n");
      }
    } else {
      $i.print(e);
    }
  });
})();
  EPILOGUE

  if ColdRuby.debug
    puts ">>>>>>>>>>>>> COMPILE"
    puts compiled
    puts

    $> = STDOUT
  end

  compiled
end

if __FILE__ == $0
  runtime = get_runtime
  runtime.each_with_index do |(file, code), i|
    puts file;        $>.flush
    code << %{$i.print('.');}
    if i < runtime.length - 1
      code << %{$i.exec();}
    else
      code << %{$i.print('\\n');}
    end
    puts code.length; $>.flush
    print code;       $>.flush
  end

  loop do
    trap("TERM") { exit }

    file, scope = gets.strip, JSON.parse(gets.strip)
    if file == '-'
      length = gets.to_i
      code = compile($<.read(length), scope, false)
    else
      code = compile(file, scope, true)
    end
    puts file;        $>.flush
    puts code.length; $>.flush
    print code;       $>.flush
  end
end