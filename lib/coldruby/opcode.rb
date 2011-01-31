module ColdRuby
  class Opcode
    VM_CALL_ARGS_SPLAT_BIT    = 2
    VM_CALL_ARGS_BLOCKARG_BIT = 4
    VM_CALL_FCALL_BIT         = 8
    VM_CALL_VCALL_BIT         = 16
    
    attr_reader :type, :info
    
    def initialize(pool, opcode)
      @pool = pool
      
      case opcode
      when Fixnum
        @type = :line
        @info = opcode
      when Symbol
        @type = :label
        @info = opcode
      when Array
        @type = opcode[0]
        @info = opcode[1..-1]
      else
        raise Exception, "Unknown opcode: #{opcode.inspect}"
      end
    end
    
    def self.label_to_id(label)
      label.to_s.match(/(\d+)$/)[0].to_i
    end
    
    def leaves?
      [ :leave, :jump ].include? @type
    end
    
    def inspect
      "<%#{@type}: #{@info.inspect}>"
    end
    
    def to_js
      case type
      when :line, :label
        nil # Handled specially in ISeq/Chunk, no code generation needed
      when :nop, :trace
        nil # Ignore

      when :putnil
        %Q{this.sf.stack[this.sf.sp++] = this.ruby.builtin.nil;}
      when :putself
        %Q{this.sf.stack[this.sf.sp++] = this.sf.self;}
      when :putstring
        %Q{this.sf.stack[this.sf.sp++] = "#{@info[0]}";}
      when :putobject
        object = @info[0]
        case object
        when Fixnum
          %Q{this.sf.stack[this.sf.sp++] = #{object};}
        when Symbol          
          @pool.register_symbol object
          %Q{this.sf.stack[this.sf.sp++] = this.ruby.builtin.get_symbol(#{object.object_id});}
        when true
          %Q{this.sf.stack[this.sf.sp++] = this.ruby.builtin.Qtrue;}
        when false
          %Q{this.sf.stack[this.sf.sp++] = this.ruby.builtin.Qfalse;}
        end

      when :pop
        %Q{this.sf.sp--;}
        
      when :dup
        [
          %Q{this.sf.stack[this.sf.sp] = this.sf.stack[this.sf.sp - 1];},
          %Q{this.sf.sp++;},
        ]
      
      when :setlocal
        %Q{this.osf.locals[#{@info[0]}] = this.sf.stack[--this.sf.sp];}
      when :getlocal
        %Q{this.sf.stack[this.sf.sp++] = this.osf.locals[#{@info[0]}];}
        
      when :setglobal
        %Q{this.ruby.globals['#{@info[0]}'] = this.sf.stack[--this.sf.sp];}
      when :getglobal
        %Q{this.sf.stack[this.sf.sp++] = this.ruby.globals['#{@info[0]}'];}
        
      when :setinstancevariable
        %Q{this.sf.self.ivs['#{@info[0]}'] = this.sf.stack[--this.sf.sp];}
      when :getinstancevariable
        %Q{this.sf.stack[this.sf.sp++] = this.sf.self.ivs['#{@info[0]}'];}
        
      when :send
        code = [ "{" ]
        
        if @info[1] > 0
          code << %Q{var args = this.sf.stack.slice(this.sf.sp - #{@info[1]}, this.sf.sp);}
          code << %Q{this.sf.sp -= #{@info[1]};}
        end
        
        receiver = nil
        if (@info[3] & VM_CALL_FCALL_BIT) != 0
          receiver = %Q{this.sf.self}
        else
          receiver = %Q{this.sf.stack[--this.sf.sp]}
        end

        if @info[1] > 0
          code << %Q{var ret = this.ruby.invoke_method(#{receiver}, '#{@info[0]}', args, this);}
        else
          code << %Q{var ret = this.ruby.invoke_method(#{receiver}, '#{@info[0]}', [], this);}
        end

        code << %Q{this.sf.stack[this.sf.sp++] = ret;}
        code << "}"
        
        code
        
      when :jump
        %Q{return #{self.class.label_to_id(@info[0])};}
      when :branchif, :branchunless
        mode = ("!" if type == :branchunless)
        [
          %Q{if(#{mode}this.ruby.test(this.sf.stack[--this.sf.sp]))},
          %Q{  return #{self.class.label_to_id(@info[0])};}
        ]
        
      when :leave
        %Q{return null;}
        
      else
        raise Exception, "Cannot translate opcode #{self.inspect}"
      end
    end
    
    def self.parse(pool, opcodes)
      opcodes.map { |opcode| Opcode.new(pool, opcode) }
    end
  end
end