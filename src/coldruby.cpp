#include <v8.h>
#include <iostream>
#include <cstring>
#include <cstdlib>
#include <sys/wait.h>
#include <signal.h>

// This complete file is an example of how not to write interface glue.
// But I'm almost forgot C++ and it's the first time I'm using V8,
// so please forgive me for letting you observe this.

using namespace v8;
using namespace std;

#define COMPILER "lib/commands/compile.rb"

const char* prelude = " \
$it = { \
  eval:    function(code, info) { return $i.exec('-', info, code.length+1, code); }, \
  compile: function(file, path) { $i.print('] Compiling ' + file + '\\n'); \
                                  $i.exec(file, path); }, \
}; \
$i.print('] Loading runtime'); \
$i.exec(); \
";
const char* compile = "$it.compile('%s', '[\".\"]');";

string ObjectToString(Local<Value> value) {
  String::Utf8Value utf8_value(value);
  return string(*utf8_value);
}

Handle<Value> API_print(const Arguments& args) {
  if (args.Length() != 1) return Undefined();

  cout << ObjectToString(args[0]) << flush;

  return Null();
}

Handle<Value> API_gets(const Arguments& args) {
  if (args.Length() != 0) return Undefined();

  string input;
  getline(cin, input);

  if(cin.eof()) {
    return Null();
  } else {
    return String::New(input.c_str(), input.length());
  }
}

static int c_in, c_out;
static pid_t c_pid;

bool fork_compiler() {
  int in[2], out[2];
  pipe(in);
  pipe(out);

  c_pid = fork();
  if(c_pid == 0) {
    dup2(in[0], 0);
    close(in[0]);
    close(in[1]);

    dup2(out[1], 1);
    close(out[0]);
    close(out[1]);

    char* argv[2] = {0};
    argv[0] = strdup(COMPILER);

    execv(argv[0], argv);
    perror("execv");

    return false;
  } else {
    close(in[0]);
    close(out[1]);

    c_in  = in[1];
    c_out = out[0];

    return true;
  }
}

void check_compiler() {
  if(waitpid(c_pid, 0, WNOHANG) != 0) {
    cout << "] Compiler died, exiting." << endl;
    exit(1);
  }
}

Handle<Value> API_exec(const Arguments& args) {
  HandleScope handle_scope;

  for(int i = 0; i < args.Length(); i++) {
    string input = ObjectToString(args[i]) + "\n";
    while(input.length() > 0) {
      int bytes = write(c_in, input.c_str(), input.length());
      input = input.substr(bytes, input.length() - bytes);
    }
  }

  char tmp;

  string fileString;

  tmp = 0;
  while(tmp != '\n') {
    check_compiler();

    read(c_out, &tmp, 1);
    fileString += tmp;
  }

  fileString = fileString.substr(0, fileString.length() - 1);

  string lengthString;

  tmp = 0;
  while(tmp != '\n') {
    check_compiler();

    read(c_out, &tmp, 1);
    lengthString += tmp;
  }

  int length = atoi(lengthString.c_str());

  string outputString;
  char buffer[2048];
  while(length > 0) {
    check_compiler();

    int bytes = read(c_out, buffer, length > sizeof(buffer) ? sizeof(buffer) : length);
    outputString += string(buffer, bytes);
    length -= bytes;
  }

  Handle<String> code = String::New(outputString.c_str(), outputString.length());
  Handle<String> file = String::New(fileString.c_str(), fileString.length());

  ScriptOrigin origin(file);

  return Script::Compile(code, &origin)->Run();
}

int main(int argc, char* argv[]) {
  if(!fork_compiler()) {
    return 1;
  }

  HandleScope handle_scope;

  Handle<ObjectTemplate> interp = ObjectTemplate::New();
  interp->Set(String::New("print"), FunctionTemplate::New(API_print));
  interp->Set(String::New("gets"),  FunctionTemplate::New(API_gets));
  interp->Set(String::New("exec"),  FunctionTemplate::New(API_exec));

  Handle<ObjectTemplate> global = ObjectTemplate::New();
  global->Set(String::New("$i"), interp);

  Persistent<Context> context = Context::New(NULL, global);
  Context::Scope context_scope(context);

  ScriptOrigin preludeOrigin(String::New("<internal:prelude>"));
  ScriptOrigin compileOrigin(String::New("<internal:compile>"));

  Script::Compile(String::New(prelude), &preludeOrigin)->Run();

  for(int i = 1; i < argc; i++) {
    char buffer[2048];
    int len = snprintf(buffer, 2048, compile, argv[i]);

    Script::Compile(String::New(buffer, len), &compileOrigin)->Run();
  }

  context.Dispose();

  kill(c_pid, SIGTERM);

  return 0;
}