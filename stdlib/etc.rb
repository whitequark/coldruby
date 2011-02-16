module Etc
  %w{getgrent getpwent setgrent setpwent
     group passwd endgrent endpwent getlogin}.each do |meth|
    define_method(meth) { }
  end

  %w{getgrnam getgrgid getpwnam getpwuid}.each do |meth|
    define_method(meth) { |what| }
  end

  def sysconfdir
    '/etc'
  end

  def systmpdir
    '/tmp'
  end
end
