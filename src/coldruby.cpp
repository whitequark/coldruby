#include <v8.h>
#include <iostream>
#include <cstring>
#include <sys/wait.h>

// This complete file is an example of how not to write interface glue.
// But I'm almost forgot C++ and it's the first time I'm using V8,
// so please forgive me for letting you observe this.

using namespace v8;
using namespace std;

const char* prelude = " \
$i.print('Loading runtime\\n'); \
$i.eval($i.exec(null, 'lib/commands/get_runtime.rb')); \
$it = { \
  eval:    function(code) { $i.eval($i.exec(code, 'lib/commands/compile.rb', '-')); }, \
  compile: function(file, path) { $i.print('Compiling ' + file + '\\n'); \
       $i.eval($i.exec(null, 'lib/commands/compile.rb', file, path)); }, \
}; \
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

Handle<Value> API_exec(const Arguments& args) {
  if (args.Length() < 2) return Undefined();

  HandleScope handle_scope;

  string input    = ObjectToString(args[0]);
  string filename = ObjectToString(args[1]);

  int in[2], out[2];
  pipe(in);
  pipe(out);

  pid_t child = fork();
  if(child == 0) {
    dup2(in[0], 0);
    close(in[0]);
    close(in[1]);

    dup2(out[1], 1);
    close(out[0]);
    close(out[1]);

    int argc = args.Length() - 1;
    char* argv[argc + 1];
    argv[argc] = NULL;

    for(int i = 0; i < argc; i++) {
      argv[i] = strdup(ObjectToString(args[i + 1]).c_str());
    }

    execv(filename.c_str(), argv);
  } else {
    close(in[0]);
    close(out[1]);

    while(input.length() > 0) {
      int bytes = write(in[1], input.c_str(), input.length());
      input = input.substr(bytes, input.length() - bytes);
    }
    close(in[1]);

    waitpid(child, NULL, 0);

    string outputString;
    char buffer[2048];
    while(true) {
      int bytes = read(out[0], buffer, sizeof(buffer));
      if(bytes <= 0)
        break;

      outputString += string(buffer, bytes);
    }

    return String::New(outputString.c_str(), outputString.length());
  }
}

int main(int argc, char* argv[]) {
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

  return 0;
}