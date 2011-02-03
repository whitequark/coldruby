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
  eval:    function(code) { $i.eval($i.exec('-', code.length, code)); }, \
  compile: function(file, path) { $i.print('] Compiling ' + file + '\\n'); \
       $i.eval($i.exec(file, path)); }, \
}; \
$i.print('] Loading runtime\\n'); \
$i.eval($i.exec()); \
";
const char* compile = "$it.compile('%s', '[]');";

string ObjectToString(Local<Value> value) {
  String::Utf8Value utf8_value(value);
  return string(*utf8_value);
}

Handle<Value> API_print(const Arguments& args) {
  if (args.Length() != 1) return Undefined();

  cout << ObjectToString(args[0]);

  return Null();
}

Handle<Value> API_eval(const Arguments& args) {
  if (args.Length() != 1) return Undefined();

  HandleScope scope;
  Handle<Value> arg = args[0];

  if(!arg->IsString())
    return Undefined();

  return Script::Compile(Handle<String>::Cast(arg))->Run();
}

static int c_in, c_out;
static pid_t c_pid;

bool fork_compiler() {
  int in[2], out[2];
  pipe(in);
  pipe(out);

  pid_t c_pid = fork();
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

Handle<Value> API_exec(const Arguments& args) {
  HandleScope handle_scope;

  for(int i = 0; i < args.Length(); i++) {
    string input = ObjectToString(args[i]) + "\n";
    while(input.length() > 0) {
      int bytes = write(c_in, input.c_str(), input.length());
      input = input.substr(bytes, input.length() - bytes);
    }
  }

  string lengthString;
  char lBuffer = 0;
  while(lBuffer != '\n') {
    read(c_out, &lBuffer, 1);
    lengthString += lBuffer;
  }

  int length = atoi(lengthString.c_str());

  string outputString;
  char buffer[2048];
  while(length > 0) {
    int bytes = read(c_out, buffer, length > sizeof(buffer) ? sizeof(buffer) : length);
    outputString += string(buffer, bytes);
    length -= bytes;
  }

  return String::New(outputString.c_str(), outputString.length());
}

int main(int argc, char* argv[]) {
  if(!fork_compiler()) {
    return 1;
  }

  HandleScope handle_scope;

  Handle<ObjectTemplate> interp = ObjectTemplate::New();
  interp->Set(String::New("print"), FunctionTemplate::New(API_print));
  interp->Set(String::New("eval"),  FunctionTemplate::New(API_eval));
  interp->Set(String::New("exec"),  FunctionTemplate::New(API_exec));

  Handle<ObjectTemplate> global = ObjectTemplate::New();
  global->Set(String::New("$i"), interp);

  Persistent<Context> context = Context::New(NULL, global);
  Context::Scope context_scope(context);

  Script::Compile(String::New(prelude))->Run();

  for(int i = 1; i < argc; i++) {
    char buffer[2048];
    int len = snprintf(buffer, 2048, compile, argv[i]);

    Script::Compile(String::New(buffer, len))->Run();
  }

  context.Dispose();

  kill(c_pid, SIGTERM);

  return 0;
}