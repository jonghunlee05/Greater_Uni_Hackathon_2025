import sys
from os import _exit

def check(code):
    if " " in code or len(code) > 47:
        return False

    return True

def safe_eval(code, exit):
    def hook(*a):
        exit(0)
    def dummy(*a):
        pass
    def fake_exit(*a):
        pass

    dummy.__code__ = compile(code, "<code>", "eval")
    sys.addaudithook(hook)
    res = dummy()
    exit = fake_exit
    return res

code = input(">")

if check(code):
    res = safe_eval(code, _exit)
    if res == 67:
        print("winner?")
    else:
        print("womp womp...")
else:
    print("NUH UH!")