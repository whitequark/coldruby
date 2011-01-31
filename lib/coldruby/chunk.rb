module ColdRuby
  class Chunk
    attr_reader :id
    attr_accessor :next
    
    def initialize(id, start_line)
      @id, @line = id, start_line
      @opcodes = []
    end
    
    def append(opcode)
      @opcodes << opcode
    end
    alias :<< :append

    def to_js
      translation = []
      last_leaves = @opcodes.last.leaves? 
      
      @opcodes.each do |opcode|
        translation << "/* #{opcode.inspect} */"
        
        code = opcode.to_js
        translation << code if code
      
        if opcode.leaves?
          last_leaves = true
          break
        end
      end 
      
      translation << "/* Default next chunk */" <<
                     "return #{@next};" if @next && !last_leaves
      
      "function() {\n    #{translation.join "\n    "}\n  }"      
    end
  end
end