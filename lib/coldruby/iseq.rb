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

      elems = []
      elems << "  klass: $c.InstructionSequence"
      elems << <<-INFO.rstrip
  info: {
    arg_size:   #{@arg_size},
    local_size: #{@local_size},
    stack_max:  #{@stack_max},

    func:   '#{@function}',
    file:   '#{@file}',
    path:   '#{@path}',

    type:   '#{@type}',
    locals: [#{@locals.map { |l| "'#{l}'" }.join ', '}],
  }
      INFO
      elems += chunks.map { |chunk| "  #{chunk.id}: #{chunk.to_js}" }

      pad = "  " * @level * 2
      output = "{\n#{elems.join ",\n"}\n}"

      output.gsub(/^/, pad).lstrip
    end
  end
end
