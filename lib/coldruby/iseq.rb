module ColdRuby
  class CatchTableChunk
    attr_reader :id

    def initialize(id, type, iseq)
      @id = id
      @type, @iseq = type, iseq
    end

    def to_js
      <<-END.rstrip
function() {
    /* Catch Table Chunk: #{@type} */
    var sf = this.context.sf;
    var iseq = #{@iseq.compile};

    var exec_opts = {
      self: sf.self,
      ddef: sf.ddef,
      cref: sf.cref,

      outer: sf,
    };

    var exception = sf.stack[--sf.sp];
    sf.stack[sf.sp++] = this.execute(exec_opts, iseq, [], exception);
  }
      END
    end
  end

  class ISeq
    attr_reader :function, :file, :path, :line

    def initialize(pool, opcodes)
      if opcodes[0] != "YARVInstructionSequence/SimpleDataFormat"
        raise Exception, "Invalid opcode magic"
      end

      major, minor, format = *opcodes[1..3]
      if [1,2,1] != [major, minor, format]
        raise Exception, "Invalid opcode version"
      end

      @arg_size   = opcodes[4][:arg_size]
      @local_size = opcodes[4][:local_size]
      @stack_max  = opcodes[4][:stack_max]

      @function = opcodes[5]
      @file     = opcodes[6]
      @path     = opcodes[7]
      @line     = opcodes[8]

      @type   = opcodes[9]
      @locals = opcodes[10]

      @args   = opcodes[11]
      if @args.is_a? Integer
        args    = [0, [], 0, 0, -1, -1, 0]
        args[0] = @args
        @args   = args
      end

      @catch_table = opcodes[12]

      @pool   = pool
      @seq    = Opcode.parse(@pool, opcodes[13])
    end

    # Returns a list of chunks.
    # A chunk is a JS closure; it returns an ID of the next chunk if it jumps,
    # and null if it leaves.
    # +this+ should contain context.
    def compile
      chunk_id = 0
      chunks = []

      line = chunk = nil
      @seq.each do |opcode|
        line = opcode.info if opcode.type == :line

        if opcode.type == :label
          chunk_id = Opcode.label_to_id(opcode.info)

          if chunk
            chunks << chunk if chunk
            chunk.next = chunk_id
            chunk = nil
          end

          next
        end

        if chunk.nil?
          chunk = Chunk.new(chunk_id, line)
        end

        chunk << opcode
      end
      chunks << chunk

      catch_table = []
      @catch_table.each do |type, iseq, st, ed, cont, sp|
        st, ed, cont = *[st, ed, cont].map { |l| Opcode.label_to_id l }
        if [:break, :retry, :rescue, :ensure].include? type
          if !iseq.nil?
            chunk_id += 1
            chunks << CatchTableChunk.new(chunk_id, type,
                                ISeq.new(@pool, iseq))
            handler = chunk_id
          end

          fields = ["type: '#{type}'", "st: #{st}", "ed: #{ed}",
                 "cont: #{cont}", "sp: #{sp}"]
          fields << "handler: #{handler}" if handler

          catch_table << %Q<{ #{fields.join(", ")} }>
        elsif [:redo, :next].include? type
          # Ignore?
        else
          raise UnknownFeatureException, "catch type: #{type}"
        end
      end

      elems = []
      elems << "  klass: ruby.c.InstructionSequence"
      elems << <<-INFO.rstrip
  info: {
    arg_size:   #{@arg_size},
    local_size: #{@local_size},
    stack_max:  #{@stack_max},

    catch_table: [
      #{catch_table.join ",\n      "}
    ],

    args: {
      opt_jumptable: #{@args[1].map { |arg| Opcode.label_to_id(arg) }},
      argc:  #{@args[0]},
      post:  #{@args[2]},
      rest:  #{@args[4]},
      block: #{@args[5]},
    },

    func:   '#{@function}',
    file:   '#{@file}',
    line:   #{@line},
    path:   '#{@path}',

    type:   '#{@type}',
    locals: [#{@locals.map { |l| "'#{l}'" }.join ', '}]
  }
      INFO
      elems += chunks.map { |chunk| "  #{chunk.id}: #{chunk.to_js}" }

      pad = "    "# * (@level + 1)
      output = "{\n#{elems.join ",\n"}\n}"

      output.gsub(/^/, pad).lstrip
    end
  end
end
