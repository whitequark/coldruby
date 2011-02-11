# Various stubs

class Thread
  @@current = {}
  def self.current
    @@current
  end
end

ENV = {}
