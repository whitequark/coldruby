var ruby = require('ruby');
require('ruby-protect');
require('ruby-http');

ruby.protect_node(function() {
  require('./hello_ruby');
})();

