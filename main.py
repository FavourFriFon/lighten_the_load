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
    

# Extension : at most L boxes per group  (boxes, k, L, expected answer or None)
extensionExamples = [
    ([7, 2, 5, 10, 8], 3, 2, 15),
    ([7, 2, 5, 10, 8], 2, 2, None),
    ([7, 2, 5, 10, 8], 5, 1, 10),
    
]

for w, k, L, expected in extensionExamples:
    print(f"Boxes {w}, k={k}, L={L}, expected {expected}")

    dpResult= DynamicProgramming_Partition(w, k, L)
    if dpResult is None:
        dpAnswer = None
        dpOk = True
    else:
        dpAnswer, dpGroups = dpResult
        ok,reason = checkSplit(w, k, dpAnswer, dpGroups)
        dpOk = ok and all(len(group) <= L for group in dpGroups)
    status = "PASS " if (dpAnswer == expected and dpOk) else "FAIL "
    print(f"{status}DP: {dpAnswer}")

    bsResult = solve_L(w, k, L)
    if bsResult is None:
        bsAnswer = None
        bsOk = True
    else:
        bsAnswer, bsGroups = bsResult
        ok, reason = checkSplit(w, k, bsAnswer, bsGroups)
        bsOk = ok and all(len(group) <= L for group in bsGroups)
    status = "PASS " if (bsAnswer == expected and bsOk) else "FAIL "
    print(f"{status}Binary Search: {bsAnswer}")

# Bad input: every method must refuse an impossible k
for name, method in METHODS.items():
    for w, k in [([7, 2, 5], 0), ([7, 2, 5], 4)]:
        try:
            method(w, k)
            print(f"FAIL {name}: no error for k = {k}")
        except ValueError:
            print(f"PASS {name}: ValueError for k = {k}")
        except Exception as e:
            print(f"FAIL {name}: wrong error for k = {k} ({type(e).__name__})")
