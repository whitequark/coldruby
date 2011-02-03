require 'json'

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

    VM_DEFINE_CLASS    = 0
    VM_SINGLETON_CLASS = 1
    VM_DEFINE_MODULE   = 2

    DEFINED_IVAR = 3

    C_VM_ARRAY_REMAINS = 1

    attr_reader :type, :info, :pool

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

    PUSH   = 'sf.stack[sf.sp++]'
    POP    = 'sf.stack[--sf.sp]'
    TOP    = 'sf.stack[sf.sp - 1]'
    SYMBOL = lambda { |opcode, symbol|
                      opcode.pool.register_symbol(symbol);
                      %Q{this.id2sym(this.symbols[#{symbol.object_id}])}
                    }

    # Here I'd like to express my appreciation to everyone who has thoroughly documented
    # the YARV bytecode. It may or may not be an internal data structure, but some
    # documentation should definitely exist (apart from random japanese blog entries).
    def to_js
      case type
      when :label
        nil # Handled specially in ISeq/Chunk, no code generation needed
      when :nop, :trace
        nil # Ignore

      when :line
        %Q{sf.line = #{@info};}

      when :putnil
        %Q{#{PUSH} = this.builtin.Qnil;}
      when :putself
        %Q{#{PUSH} = sf.self;}
      when :putobject, :putstring
        object = @info[0]
        case object
        when Fixnum
          %Q{#{PUSH} = #{object};}
        when String
          %Q{#{PUSH} = #{@info[0].to_json};}
        when Float
          %Q{#{PUSH} = this.builtin.make_float(#{@info[0].inspect});}
        when Range
          %Q{#{PUSH} = this.builtin.make_range(#{@info[0].begin.inspect}, #{@info[0].end.inspect}, #{@info[0].exclude_end?});}
        when Symbol
          %Q{#{PUSH} = #{SYMBOL[self, object]};}
        when true
          %Q{#{PUSH} = this.builtin.Qtrue;}
        when false
          %Q{#{PUSH} = this.builtin.Qfalse;}
        when Object
          %Q{#{PUSH} = this.internal_constants.Object;}
        else
          raise UnknownFeatureException, "putobject type #{object}"
        end
      when :putspecialobject
        case @info[0]
        when VM_SPECIAL_OBJECT_VMCORE
          %Q{#{PUSH} = this.builtin.vmcore;}
        when VM_SPECIAL_OBJECT_CBASE
          %Q{#{PUSH} = sf.ddef;}
        when VM_SPECIAL_OBJECT_CONST_BASE
          # Just guessing.
          %Q{#{PUSH} = sf.cref[0];}

        else
          raise UnknownFeatureException, "putspecialobject type #{@info[0]}"
        end
      when :putiseq
        %Q{#{PUSH} = #{ISeq.new(@pool, @info[0], @level + 1).compile};}

      when :tostring
        [
          %Q{if((typeof #{TOP}) != 'string')},
          %Q{  #{TOP} = this.funcall(#{TOP}, 'to_s');}
        ]
      when :concatstrings
        [
          %Q{var strings = sf.stack.slice(sf.sp - #{@info[0]}, sf.sp);},
          %Q{sf.sp -= #{@info[0]};},
          %Q{#{PUSH} = strings.join('');}
        ]

      when :getconstant
        [
          %Q{var module = #{POP};},
          %Q{#{PUSH} = this.const_get(module, #{SYMBOL[self, @info[0]]})}
        ]

      when :setconstant
        [
          %Q{var module = #{POP};},
          %Q{this.const_set(module, #{SYMBOL[self, @info[0]]}, #{POP})}
        ]

      when :newarray
        [
          %Q{var value = sf.stack.slice(sf.sp - #{@info[0]}, sf.sp);},
          %Q{sf.sp -= #{@info[0]};},
          %Q{#{PUSH} = value;}
        ]
      when :duparray
        # Looks like this instruction will only work with arrays of same elements.
        case @info[0][0]
        when String
          %Q{#{PUSH} = #{@info[0].to_json};}
        when Symbol
          %Q<#{PUSH} = [#{ @info[0].map { |s| SYMBOL[self, s]}.join ', ' }];>
        else
          raise UnknownFeatureException, "unknown duparray elem (#{@info[0][0].class})"
        end
      when :splatarray
        if @info[0] != false
          raise UnknownFeatureException, "unknown splatarray flags (#{@info[0]})"
        end

        [
          %Q{var array = #{POP};},
          %Q{array = this.check_convert_type(array, this.internal_constants.Array, 'to_a');},
          %Q{if(array == this.builtin.Qnil)},
          %Q{  array = [];},
          %Q{#{PUSH} = array;}
        ]
      when :expandarray
        code = []

        code << %Q{var array = #{POP};}
        code << %Q{this.check_type(array, this.internal_constants.Array);}

        if (@info[1] & C_VM_ARRAY_REMAINS) != 0 # pack remainings into other array
          code << %Q{#{PUSH} = array.slice(#{@info[0]}, array.length);}
        elsif @info[1] != 0
          raise UnknownFeatureException, "unknown expandarray flags (#{@info[1]})"
        end

        code << %Q{for(var i = 0; i < #{@info[0]}; i++)}
        code << %Q{  #{PUSH} = array[#{@info[0]} - i - 1];}

        code
      when :concatarray
        [
          %Q{var array = #{POP};},
          %Q{array = #{POP}.concat(array);},
          %Q{#{PUSH} = array;}
        ]

      when :newhash
        [
          %Q{var hash = sf.stack.slice(sf.sp - #{@info[0]}, sf.sp)},
          %Q{sf.sp -= #{@info[0]}},
          %Q{#{PUSH} = this.builtin.make_hash(hash);}
        ]

      when :pop
        %Q{sf.sp--;}
      when :adjuststack
        %Q{sf.sp -= #{@info[0]};}
      when :dup
        [
          %Q{sf.stack[sf.sp] = sf.stack[sf.sp - 1];},
          %Q{sf.sp++;},
        ]
      when :dupn
        [
          %Q{for(var i = 0; i < #{@info[0]}; i++)},
          %Q{  sf.stack[sf.sp + i] = sf.stack[sf.sp + i - #{@info[0]}];},
          %Q{sf.sp += #{@info[0]};}
        ]
      when :topn
        [
          %Q{sf.stack[sf.sp] = sf.stack[sf.sp - #{@info[0]}];},
          %Q{sf.sp++;}
        ]
      when :setn
        %Q{sf.stack[sf.sp - #{@info[0] - 1}] = sf.stack[sf.sp - 1];}
      when :swap
        [
          %Q{var tmp = sf.stack[sf.sp - 1];},
          %Q{sf.stack[sf.sp - 1] = sf.stack[sf.sp - 2];},
          %Q{sf.stack[sf.sp - 2] = tmp;},
        ]

      when :setlocal
        %Q{sf.osf.locals[#{@info[0]}] = #{POP};}
      when :getlocal
        %Q{#{PUSH} = sf.osf.locals[#{@info[0]}];}

      when :setdynamic
        %Q{sf.dynamic[#{@info[1]}].locals[#{@info[0]}] = #{POP};}
      when :getdynamic
        %Q{#{PUSH} = sf.dynamic[#{@info[1]}].locals[#{@info[0]}];}

      when :setglobal
        %Q{this.gvar_set(#{@info[0].to_json}, #{POP});}
      when :getglobal
        %Q{#{PUSH} = this.gvar_get(#{@info[0].to_json});}

      when :setinstancevariable
        %Q{sf.self.ivs[#{@info[0].to_json}] = #{POP};}
      when :getinstancevariable
        %Q{#{PUSH} = sf.self.ivs[#{@info[0].to_json}];}

      when :send, :invokeblock
        code = []

        if type == :send
          argcount, options = @info[1], @info[3]
        elsif type == :invokeblock
          argcount, options = @info[0], @info[1]
        end

        if (options & ~(VM_CALL_ARGS_SPLAT_BIT | VM_CALL_FCALL_BIT |
                        VM_CALL_ARGS_BLOCKARG_BIT | VM_CALL_VCALL_BIT)) != 0
          # Honestly, I don't know what VM_CALL_VCALL_BIT _really_ does.
          # But it works this way, so I accept it.
          raise UnknownFeatureException, "#{type} opcode flags #{options}"
        end

        if argcount > 0
          code << %Q{var args = sf.stack.slice(sf.sp - #{argcount}, sf.sp);}
          code << %Q{sf.sp -= #{argcount};}

          if (options & VM_CALL_ARGS_SPLAT_BIT) != 0
            code << %Q{args = args.concat(args.pop());}
          end

          args = 'args'
        else
          args = '[]'
        end

        if (options & VM_CALL_ARGS_BLOCKARG_BIT) != 0
          code.unshift %Q{var block = #{POP}.iseq;}
          args << ', block'
        end


        if type == :send
          if (options & VM_CALL_FCALL_BIT) != 0
            code << %Q{sf.sp--;} # remove nil, which apparently means self
            receiver = %Q{sf.self}
          else
            receiver = %Q{#{POP}}
          end

          if @info[2]
            code << %Q{var iseq = #{ISeq.new(@pool, @info[2], @level + 1).compile};}
            code << %Q{iseq.stack_frame = sf;}
            args << ', iseq'
          end

          method = @info[0].to_sym
          @pool.register_symbol method

          code << %Q[var ret = this.funcall2(#{receiver}, ] +
                  %Q[this.symbols[#{method.object_id}], #{args});]
        elsif type == :invokeblock
          code << %Q[var ret = this.yield2(#{args});]
        end

        code << %Q{#{PUSH} = ret;}

        code

      when :defineclass
        code = [
          %Q{var iseq = #{ISeq.new(@pool, @info[1], @level + 1).compile};},
          %Q{var superklass = #{POP};},
          %Q{var cbase = #{POP};},
        ]

        case @info[2]
        when VM_DEFINE_MODULE, VM_DEFINE_CLASS
          define_class = @info[2] == VM_DEFINE_MODULE ? 'false' : 'true'
          code << %Q{#{PUSH} = this.execute_class(cbase, } +
                  %Q{#{@info[0].to_json}, superklass, #{define_class}, iseq);}
        when VM_SINGLETON_CLASS
          code << %Q{#{PUSH} = this.execute_class(cbase, null, null, null, iseq);}
        else
          raise UnknownFeatureException, "defineclass type #{@info[2]}"
        end

        code

      when :defined
        object = @info[1]
        case @info[0]
        when DEFINED_IVAR
          cond, str = %Q{obj.ivs['#{object}']}, 'instance-variable'
        end

        code = [
          %Q{var obj = #{POP};},
          %Q{if(obj == this.builtin.Qnil)},
          %Q{  obj = sf.self; }
        ]

        if @info[2]
          code << %Q{#{PUSH} = (#{cond}) ? '#{str}' : this.builtin.Qnil;}
        else
          code << %Q{#{PUSH} = (#{cond}) ? this.builtin.Qtrue : this.builtin.Qfalse;}
        end

        code

      when :jump
        %Q{return #{self.class.label_to_id(@info[0])};}
      when :branchif, :branchunless
        mode = ("!" if type == :branchunless)
        [
          %Q{if(#{mode}this.test(#{POP}))},
          %Q{  return #{self.class.label_to_id(@info[0])};}
        ]

      when :leave
        %Q{return null;}

      # Optimized versions. Just skip them now.
      when :opt_case_dispatch

      else
        raise UnknownFeatureException, "opcode #{self.inspect}"
      end
    end

    def self.parse(pool, opcodes, level=0)
      opcodes.map { |opcode| Opcode.new(pool, opcode, level) }
    end
  end
end
