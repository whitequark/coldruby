module ColdRuby
  class Pool
    def initialize
      @symbols = []
    end
    
    def symbols
      %Q<{ #{@symbols.map { |symbol| %Q{#{symbol.object_id}: '#{symbol.to_s}'}}.join ', '} }>
    end
    
    def register_symbol(symbol)
      @symbols << symbol if !@symbols.include? symbol      
    end
  end
end