module ColdRuby
  class Opcode
    VM_CALL_ARGS_SPLAT_BIT    = 2
    VM_CALL_ARGS_BLOCKARG_BIT = 4
    VM_CALL_FCALL_BIT         = 8
    VM_CALL_VCALL_BIT         = 16

    VM_SPECIAL_OBJECT_VMCORE = 1
    VM_SPECIAL_OBJECT_CBASE  = 2

    attr_reader :type, :info

    def initialize(pool, opcode, level=0)
      @pool = pool
      @level = level

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
        else
          raise Exception, "Unhandled putobject opcode: #{object}"
        end
      when :putspecialobject
        case @info[0]
        when VM_SPECIAL_OBJECT_VMCORE
          %Q{this.sf.stack[this.sf.sp++] = this.ruby.builtin.vmcore;}
        when VM_SPECIAL_OBJECT_CBASE
          %Q{this.sf.stack[this.sf.sp++] = this.sf.cbase;}
        else
          raise Exception, "Unhandled putspecialobject opcode"
        end
      when :putiseq
        %Q{this.sf.stack[this.sf.sp++] = #{ISeq.new(@pool, @info[0], @level + 1).compile};}

      when :newarray
        [
          %Q{var value = this.sf.stack.slice(this.sf.sp - #{@info[0]}, this.sf.sp);},
          %Q{this.sf.sp -= #{@info[0]};},
          %Q{this.sf.stack[this.sf.sp++] = value;}
        ]
      when :duparray
        %Q{this.sf.stack[this.sf.sp++] = #{@info[0]};}
      when :splatarray
        [
          %Q{var array = this.sf.stack[--this.sf.sp];},
          %Q{array = this.ruby.check_convert_type(array, this.ruby.constants.Array, 'to_a');},
          %Q{if(array == this.ruby.builtin.Qnil)},
          %Q{  array = [];},
          %Q{this.sf.stack[this.sf.sp++] = array;}
        ]
      when :expandarray
        code = []

        code << %Q{var array = this.sf.stack[--this.sf.sp];}
        code << %Q{this.ruby.check_type(array, this.ruby.constants.Array);}

        if (@info[1] & 1) != 0 # pack remainings into other array
          code << %Q{this.sf.stack[this.sf.sp++] = array.slice(#{@info[0]}, array.length);}
        end

        code << %Q{for(var i = 0; i < #{@info[0]}; i++)}
        code << %Q{  this.sf.stack[this.sf.sp++] = array[#{@info[0]} - i - 1];}

        code

      when :pop
        %Q{this.sf.sp--;}
      when :emptstack
        %Q{this.sf.sp = 0;}

      when :dup
        [
          %Q{this.sf.stack[this.sf.sp] = this.sf.stack[this.sf.sp - 1];},
          %Q{this.sf.sp++;},
        ]
      when :dupn
        [
          %Q{for(var i = 0; i < #{@info[0]}; i++)},
          %Q{  this.sf.stack[this.sf.sp + i] = this.sf.stack[this.sf.sp + i - #{@info[0]}];},
          %Q{this.sf.sp += #{@info[0]};}
        ]
      when :topn
        [
          %Q{this.sf.stack[this.sf.sp] = this.sf.stack[this.sf.sp - #{@info[0]}];},
          %Q{this.sf.sp++;}
        ]
      when :setn
        %Q{this.sf.stack[this.sf.sp - #{@info[0]}] = this.sf.stack[this.sf.sp - 1];}
      when :swap
        [
          %Q{var tmp = this.sf.stack[this.sf.sp - 1];},
          %Q{this.sf.stack[this.sf.sp - 1] = this.sf.stack[this.sf.sp - 2];},
          %Q{this.sf.stack[this.sf.sp - 2] = tmp;]},
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
        code = []

        if @info[1] > 0
          code << %Q{var args = this.sf.stack.slice(this.sf.sp - #{@info[1]}, this.sf.sp);}
          code << %Q{this.sf.sp -= #{@info[1]};}

          if (@info[3] & VM_CALL_ARGS_SPLAT_BIT) != 0
            code << %Q{args = args.concat(args.pop());}
          end
        end

        receiver = nil
        if (@info[3] & VM_CALL_FCALL_BIT) != 0
          code << %Q{this.sf.sp--;} # remove nil, which apparently means self
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

    def self.parse(pool, opcodes, level=0)
      opcodes.map { |opcode| Opcode.new(pool, opcode, level) }
    end
  end
end