module ColdRuby
  class ISeq
    attr_reader :function, :file, :fullpath

    def initialize(pool, opcodes)
      if opcodes[0] != "YARVInstructionSequence/SimpleDataFormat"
        raise Exception, "Invalid opcode format"
      end

      @arg_size   = opcodes[4][:arg_size]
      @local_size = opcodes[4][:local_size]
      @stack_max  = opcodes[4][:stack_max]

      @function = opcodes[5]
      @file     = opcodes[6]
      @path     = opcodes[7]

      @locals = opcodes[10]

      @pool   = pool
      @seq    = Opcode.parse(@pool, opcodes[13])
    end

    # Returns a list of chunks.
    # A chunk is a JS closure; it returns an ID of the next chunk if it jumps,
    # and null if it leaves.
    # +this+ should contain context.
    def chunks
      chunk_id = 0
      chunks = []

      line = chunk = nil
      @seq.each do |opcode|
        line = opcode.info if opcode.type == :line

        if opcode.type == :label
          chunks << chunk

          chunk_id = Opcode.label_to_id(opcode.info)
          chunk.next = chunk_id
          chunk = nil

          next
        end

        if chunk.nil?
          chunk = Chunk.new(chunk_id, line)
        end

        chunk << opcode
      end
      chunks << chunk

      elems = chunks.map { |chunk| "  #{chunk.id}: #{chunk.to_js}" }.join ",\n"
      "{\n#{elems}\n}"
    end
  end
end
