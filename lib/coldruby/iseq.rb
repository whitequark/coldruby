module ColdRuby
  class ISeq
    attr_reader :function, :file, :path, :line

    def initialize(pool, opcodes, level=0)
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
      @level  = level
      @seq    = Opcode.parse(@pool, opcodes[13], level)
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
        if [:break, :rescue].include? type
          ent = ""
          ent << %Q<{ type: '#{type}', st: #{st}, ed: #{ed}, cont: #{cont}, sp: #{sp}>
          if iseq.nil?
            ent << %Q< }>
          else
            ent << %Q<, iseq: #{ISeq.new(@pool, iseq, @level + 2).compile} }>
          end
          catch_table << ent
        elsif [:redo, :next, :ensure, :retry].include? type
          # Ignore?
        else
          raise UnknownFeatureException, "catch type: #{type}"
        end
      end

      elems = []
      elems << "  klass: $c.InstructionSequence"
      elems << <<-INFO.rstrip
  info: {
    arg_size:   #{@arg_size},
    local_size: #{@local_size},
    stack_max:  #{@stack_max},

    catch_table: [
      #{catch_table.join ",\n      "}
    ],

    args: {
      argc:  #{@args[0]},
      rest:  #{@args[4]},
      block: #{@args[5]},
    },

    func:   '#{@function}',
    file:   '#{@file}',
    line:   #{@line},
    path:   '#{@path}',

    type:   '#{@type}',
    locals: [#{@locals.map { |l| "'#{l}'" }.join ', '}],
  }
      INFO
      elems += chunks.map { |chunk| "  #{chunk.id}: #{chunk.to_js}" }

      pad = "  " + "  " * @level
      output = "{\n#{elems.join ",\n"}\n}"

      output.gsub(/^/, pad).lstrip
    end
  end
end
