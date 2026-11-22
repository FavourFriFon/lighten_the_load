import random
from methods import METHODS
from exhaustive import checkSplit

w = [7, 2, 5, 10, 8]
k= 2

for name, method in METHODS.items():
    answer, groups = method(w, k)
    ok,reason = checkSplit(w, k, answer, groups)
    print(f"{name}: {answer}, {groups} [{reason}]")

examples = [
    ([7, 2, 5, 10, 8], 2,18),
    ([7, 2, 5, 10, 8], 3,14),
    ([1,1,100,1,1], 2,102),
   
]


for w, k, expected in examples:
    print(f"Boxes {w}, k={k}, expected {expected}")
    for name, method in METHODS.items():
        answer, groups = method(w, k)
        ok,reason = checkSplit(w, k, answer, groups)
        status = "PASS " if (answer == expected and ok) else "FAIL "
        print(f"{status}{name}: {answer}, {groups} [{reason}]")


rng = random.Random(456)
failures = 0

for trial in range(1000):
    n = rng.randint(1, 12)
    k = rng.randint(1, n)
    w = [rng.randint(1, 20) for _ in range(n)]

    expected, _ = METHODS["brute force"](w, k)

    for name, method in METHODS.items():
        answer, groups = method(w, k)
        ok,reason = checkSplit(w, k, answer, groups)
        if answer != expected or not ok:
            failures += 1
            print(f"FAIL {name}: Boxes {w}, k={k}, expected {expected}, got {answer}, groups {groups} [{reason}]")

    print(f"Random checks:  {failures} failures out of 1000 inputs")

