module ColdRuby
  class UnknownFeatureException < Exception
    def initialize(message, *args)
      super("You have encountered an unknown (to the developer(s) of " <<
            "ColdRuby) feature in Ruby (#{message}). Please, contact them and " <<
            "send the relevant code for the feature to be added.")
    end
  end

  class Opcode
    VM_CALL_ARGS_SPLAT_BIT    = 2
    VM_CALL_ARGS_BLOCKARG_BIT = 4
    VM_CALL_FCALL_BIT         = 8
    VM_CALL_VCALL_BIT         = 16

    VM_SPECIAL_OBJECT_VMCORE     = 1
    VM_SPECIAL_OBJECT_CBASE      = 2
    VM_SPECIAL_OBJECT_CONST_BASE = 3

    C_VM_ARRAY_REMAINS = 1

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

    # Here I'd like to express my appreciation to everyone who has thoroughly documented
    # the YARV bytecode. It may or may not be an internal data structure, but some
    # documentation should definitely exist (apart from random japanese blog entries).
    def to_js
      case type
      when :line, :label
        nil # Handled specially in ISeq/Chunk, no code generation needed
      when :nop, :trace
        nil # Ignore

      when :putnil
        %Q{this.sf.stack[this.sf.sp++] = this.ruby.builtin.Qnil;}
      when :putself
        %Q{this.sf.stack[this.sf.sp++] = this.sf.self;}
      when :putstring
        %Q{this.sf.stack[this.sf.sp++] = #{@info[0].inspect};}
      when :putobject
        object = @info[0]
        case object
        when Fixnum
          %Q{this.sf.stack[this.sf.sp++] = #{object};}
        when Range
          %Q{this.sf.stack[this.sf.sp++] = this.ruby.builtin.make_range(#{@info[0].begin.inspect}, #{@info[0].end.inspect}, #{@info[0].exclude_end?});}
        when Symbol
          @pool.register_symbol object
          %Q{this.sf.stack[this.sf.sp++] = this.ruby.builtin.make_symbol(this.ruby.symbols[#{object.object_id}]);}
        when true
          %Q{this.sf.stack[this.sf.sp++] = this.ruby.builtin.Qtrue;}
        when false
          %Q{this.sf.stack[this.sf.sp++] = this.ruby.builtin.Qfalse;}
        else
          raise UnknownFeatureException, "putobject type #{object}"
        end
      when :putspecialobject
        case @info[0]
        when VM_SPECIAL_OBJECT_VMCORE
          %Q{this.sf.stack[this.sf.sp++] = this.ruby.builtin.vmcore;}
        when VM_SPECIAL_OBJECT_CBASE
          %Q{this.sf.stack[this.sf.sp++] = this.sf.ddef;}
        when VM_SPECIAL_OBJECT_CONST_BASE
          # Treated in a special way in setconstant
          # Why bother adding CONST_BASE if getconstant uses nil anyway?
          %Q{this.sf.stack[this.sf.sp++] = this.ruby.builtin.Qnil;}

        else
          raise UnknownFeatureException, "putspecialobject type #{@info[0]}"
        end
      when :putiseq
        %Q{this.sf.stack[this.sf.sp++] = #{ISeq.new(@pool, @info[0], @level + 1).compile};}

      when :getconstant
        [
          %Q{var module = this.sf.stack[--this.sf.sp];},
          %Q{this.sf.stack[this.sf.sp++] = this.ruby.const_get(module, '#{@info[0]}')}
        ]
      when :setconstant
        [
          %Q{var module = this.sf.stack[--this.sf.sp];},
          %Q{this.ruby.const_set(module, '#{@info[0]}', this.sf.stack[--this.sf.sp])}
        ]

      when :newarray
        [
          %Q{var value = this.sf.stack.slice(this.sf.sp - #{@info[0]}, this.sf.sp);},
          %Q{this.sf.sp -= #{@info[0]};},
          %Q{this.sf.stack[this.sf.sp++] = value;}
        ]
      when :duparray
        %Q{this.sf.stack[this.sf.sp++] = #{@info[0]};}
      when :splatarray
        if @info[0] != false
          raise UnknownFeatureException, "unknown splatarray flags (#{@info[0]})"
        end

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

        if (@info[1] & C_VM_ARRAY_REMAINS) != 0 # pack remainings into other array
          code << %Q{this.sf.stack[this.sf.sp++] = array.slice(#{@info[0]}, array.length);}
        elsif @info[1] != 0
          raise UnknownFeatureException, "unknown expandarray flags (#{@info[1]})"
        end

        code << %Q{for(var i = 0; i < #{@info[0]}; i++)}
        code << %Q{  this.sf.stack[this.sf.sp++] = array[#{@info[0]} - i - 1];}

        code
      when :concatarray
        [
          %Q{var array = this.sf.stack[--this.sf.sp];},
          %Q{array = this.sf.stack[--this.sf.sp].concat(array);},
          %Q{this.sf.stack[this.sf.sp++] = array;}
        ]

      when :newhash
        [
          %Q{var hash = this.sf.stack.slice(this.sf.sp - #{@info[0]}, this.sf.sp)},
          %Q{this.sf.sp -= #{@info[0]}},
          %Q{this.sf.stack[this.sf.sp++] = this.ruby.builtin.make_hash(hash);}
        ]

      when :pop
        %Q{this.sf.sp--;}
      when :adjuststack
        %Q{this.sf.sp -= #{@info[0]};}

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
        %Q{this.sf.osf.locals[#{@info[0]}] = this.sf.stack[--this.sf.sp];}
      when :getlocal
        %Q{this.sf.stack[this.sf.sp++] = this.sf.osf.locals[#{@info[0]}];}

      when :setdynamic
        %Q{this.sf.dynamic[#{@info[1]}].locals[#{@info[0]}] = this.sf.stack[--this.sf.sp];}
      when :getdynamic
        %Q{this.sf.stack[this.sf.sp++] = this.sf.dynamic[#{@info[1]}].locals[#{@info[0]}];}

      when :setglobal
        %Q{this.ruby.globals['#{@info[0]}'] = this.sf.stack[--this.sf.sp];}
      when :getglobal
        %Q{this.sf.stack[this.sf.sp++] = this.ruby.globals['#{@info[0]}'];}

      when :setinstancevariable
        %Q{this.sf.self.ivs['#{@info[0]}'] = this.sf.stack[--this.sf.sp];}
      when :getinstancevariable
        %Q{this.sf.stack[this.sf.sp++] = this.sf.self.ivs['#{@info[0]}'];}

      when :send, :invokeblock
        code = []

        if type == :send
          argcount, options = @info[1], @info[3]
        elsif type == :invokeblock
          argcount, options = @info[0], @info[1]
        end

        if (options & ~(VM_CALL_ARGS_SPLAT_BIT | VM_CALL_FCALL_BIT |
                        VM_CALL_VCALL_BIT)) != 0
          # Honestly, I don't know what VM_CALL_VCALL_BIT _really_ does.
          # But it works this way, so I accept it.
          raise UnknownFeatureException, "#{type} opcode flags #{options}"
        end

        if argcount > 0
          code << %Q{var args = this.sf.stack.slice(this.sf.sp - #{argcount}, this.sf.sp);}
          code << %Q{this.sf.sp -= #{argcount};}

          if (options & VM_CALL_ARGS_SPLAT_BIT) != 0
            code << %Q{args = args.concat(args.pop());}
          end

          args = 'args'
        else
          args = '[]'
        end

        if type == :send
          if (@info[3] & VM_CALL_FCALL_BIT) != 0
            code << %Q{this.sf.sp--;} # remove nil, which apparently means self
            receiver = %Q{this.sf.self}
          else
            receiver = %Q{this.sf.stack[--this.sf.sp]}
          end

          if @info[2]
            code << %Q{var iseq = #{ISeq.new(@pool, @info[2], @level + 1).compile};}
            code << %Q{iseq.stack_frame = this.sf;}
            args << ', iseq'
          end

          method = @info[0].to_sym
          @pool.register_symbol method

          code << %Q[var ret = this.ruby.invoke_method(this, #{receiver}, ] +
                  %Q[this.ruby.symbols[#{method.object_id}], #{args});]
        elsif type == :invokeblock
          code << %Q[var ret = this.ruby.yield(this, #{args});]
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
        raise UnknownFeatureException, "opcode #{self.inspect}"
      end
    end

    def self.parse(pool, opcodes, level=0)
      opcodes.map { |opcode| Opcode.new(pool, opcode, level) }
    end
  end
end
