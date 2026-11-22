import math
import random
import statistics
import time

import matplotlib.pyplot as plt
import numpy as np

import binsearch
from methods import METHODS


def timeIt(method, w, k, reps=5):
    """Run the method `reps` times and return the median time in seconds."""
    times = []
    for _ in range(reps):
        start = time.perf_counter()
        method(w, k)
        times.append(time.perf_counter() - start)
    return statistics.median(times)


def slope(sizes, times):
    """Steepness of the best straight line through the points on log-log axes."""
    return np.polyfit(np.log(sizes), np.log(times), 1)[0]


def randomBoxes(n, maxWeight, seed):
    """n random boxes, each weighing 1 to maxWeight. The same seed gives the same boxes."""
    rng = random.Random(seed)
    return [rng.randint(1, maxWeight) for _ in range(n)]


def countRounds(w, k):
    """How many packing checks binary search makes on this input.
    It swaps Donna's feasible function for a copy that counts its calls, then puts it back."""
    original = binsearch.feasible
    calls = [0]

    def countingFeasible(*args):
        calls[0] += 1
        return original(*args)

    binsearch.feasible = countingFeasible
    binsearch.binary_search_partition(w, k)
    binsearch.feasible = original
    return calls[0]


# ---------- E1: changing number of boxes, n ----------
def e1():
    print("E1: number of boxes n (k = 10)")
    k = 10

    print("  DP (n doubles each step; theory says about 4x slower)")
    dpSizes, dpTimes = [], []
    prev = None
    for n in [256, 512, 1024, 2048]:
        w = randomBoxes(n, 1000, seed=n)
        t = timeIt(METHODS["DP"], w, k)
        dpSizes.append(n)
        dpTimes.append(t)
        if prev is None:
            print(f"    n = {n}: {t:.4f} s")
        else:
            print(f"    n = {n}: {t:.4f} s  ({t / prev:.1f}x slower)")
        prev = t

    print("  Binary search (n grows 4x each step; theory says about 4x slower)")
    bsSizes, bsTimes = [], []
    prev = None
    for n in [1024, 4096, 16384, 65536, 262144]:
        w = randomBoxes(n, 1000, seed=n)
        t = timeIt(METHODS["binary search"], w, k)
        bsSizes.append(n)
        bsTimes.append(t)
        if prev is None:
            print(f"    n = {n}: {t:.4f} s")
        else:
            print(f"    n = {n}: {t:.4f} s  ({t / prev:.1f}x slower)")
        prev = t

    plt.figure()
    plt.loglog(dpSizes, dpTimes, "o-", label=f"DP (slope {slope(dpSizes, dpTimes):.2f})")
    plt.loglog(bsSizes, bsTimes, "s-", label=f"Binary search (slope {slope(bsSizes, bsTimes):.2f})")
    plt.xlabel("number of boxes n (log scale)")
    plt.ylabel("seconds (log scale)")
    plt.title("E1: running time as n grows (k = 10)")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.savefig("e1_size.png", dpi=200, bbox_inches="tight")
    plt.close()


# ---------- E2: changing number of groups ----------
def e2():
    print("E2: number of groups k (n = 400)")
    n = 400
    w = randomBoxes(n, 1000, seed=2)       # the same boxes for every k, so only k changes

    ks, dpTimes, bsTimes = [], [], []
    for k in [2, 5, 10, 20, 50, 100, 200]:
        dpTime = timeIt(METHODS["DP"], w, k)
        bsTime = timeIt(METHODS["binary search"], w, k)
        ks.append(k)
        dpTimes.append(dpTime)
        bsTimes.append(bsTime)
        print(f"  k = {k}: DP {dpTime:.4f} s, binary search {bsTime:.6f} s")

    plt.figure()
    plt.loglog(ks, dpTimes, "o-", label="DP")
    plt.loglog(ks, bsTimes, "s-", label="Binary search")
    plt.xlabel("number of groups k (log scale)")
    plt.ylabel("seconds (log scale)")
    plt.title("E2: DP slows as k grows; binary search stays flat (n = 400)")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.savefig("e2_groups.png", dpi=200, bbox_inches="tight")
    plt.close()


# ---------- E3: changing the size of the weights ----------
def e3():
    print("E3: size of the weights (n = 1000, k = 10)")
    n, k = 1000, 10

    maxWeights, dpTimes, bsTimes, rounds, predicted = [], [], [], [], []
    for maxWeight in [10, 1000, 1000000, 1000000000]:
        w = randomBoxes(n, maxWeight, seed=3)
        dpTime = timeIt(METHODS["DP"], w, k, reps=3)    # DP is slow, so 3 runs instead of 5
        bsTime = timeIt(METHODS["binary search"], w, k)
        r = countRounds(w, k)
        p = math.log2(sum(w) - max(w) + 1)              # theory: rounds = log2 of the search range
        maxWeights.append(maxWeight)
        dpTimes.append(dpTime)
        bsTimes.append(bsTime)
        rounds.append(r)
        predicted.append(p)
        print(f"  largest weight {maxWeight}: DP {dpTime:.4f} s, binary search {bsTime:.6f} s, "
              f"{r} rounds (theory {p:.1f})")

    fig, (left, right) = plt.subplots(1, 2, figsize=(11, 4))
    left.semilogx(maxWeights, rounds, "s-", color="tab:orange", label="binary search rounds")
    left.semilogx(maxWeights, predicted, "k--", label="theory: log2(S - max + 1)")
    left.set_xlabel("largest weight (log scale)")
    left.set_ylabel("packing checks")
    left.set_title("Rounds follow log2 S")
    left.legend()
    left.grid(True, alpha=0.3)

    right.loglog(maxWeights, dpTimes, "o-", label="DP")
    right.loglog(maxWeights, bsTimes, "s-", label="Binary search")
    right.set_xlabel("largest weight (log scale)")
    right.set_ylabel("seconds (log scale)")
    right.set_title("Running time")
    right.legend()
    right.grid(True, alpha=0.3)

    fig.suptitle("E3: bigger weights add binary search rounds, not DP work (n = 1000, k = 10)", y=1.03)
    plt.savefig("e3_weights.png", dpi=200, bbox_inches="tight")
    plt.close()


# ---------- E4: changing input shape ----------
def e4():
    print("E4: input shape (n = 1000, k = 10)")
    n, k = 1000, 10
    rng = random.Random(4)

    randomShape = [rng.randint(1, 1000) for _ in range(n)]
    spike = [rng.randint(1, 10) for _ in range(n)]
    spike[n // 2] = 100000                                  # one huge box in the middle
    heavy = [max(1, min(1000000, int(rng.paretovariate(1.2)))) for _ in range(n)]  # mostly light, a few very heavy

    shapes = {
        "random": randomShape,
        "sorted": sorted(randomShape),
        "all equal": [500] * n,
        "one spike": spike,
        "heavy-tailed": heavy,
    }

    names, dpTimes, bsTimes = [], [], []
    for name, w in shapes.items():
        dpTime = timeIt(METHODS["DP"], w, k, reps=3)
        bsTime = timeIt(METHODS["binary search"], w, k)
        names.append(name)
        dpTimes.append(dpTime)
        bsTimes.append(bsTime * 1000)                       # milliseconds, easier to read
        print(f"  {name}: DP {dpTime:.4f} s, binary search {bsTime:.6f} s, {countRounds(w, k)} rounds")

    fig, (left, right) = plt.subplots(1, 2, figsize=(11, 4))
    left.bar(names, dpTimes, color="tab:blue")
    left.set_ylabel("seconds")
    left.set_title("DP")
    left.tick_params(axis="x", rotation=20)

    right.bar(names, bsTimes, color="tab:orange")
    right.set_ylabel("milliseconds")
    right.set_title("Binary search")
    right.tick_params(axis="x", rotation=20)

    fig.suptitle("E4: input shape changes running time by less than 2x (n = 1000, k = 10)", y=1.03)
    plt.savefig("e4_patterns.png", dpi=200, bbox_inches="tight")
    plt.close()


# ---------- E5: changing brute force stopping point ----------
def e5(limitSeconds=60):
    print(f"E5: brute force with k = n/2, until one run takes over {limitSeconds} s")
    sizes, times = [], []
    n = 10
    while True:
        k = n // 2                                          # k = n/2 is the slowest case for each n
        w = randomBoxes(n, 1000, seed=0)
        t = timeIt(METHODS["brute force"], w, k, reps=1)    # one run only: these get very slow
        splits = math.comb(n - 1, k - 1)
        sizes.append(n)
        times.append(t)
        print(f"  n = {n}: {splits} splits, {t:.2f} s")
        if t > limitSeconds:
            break
        n += 2

    plt.figure()
    plt.semilogy(sizes, times, "^-", color="tab:green")
    plt.axhline(limitSeconds, color="gray", linestyle="--", label=f"{limitSeconds} s limit")
    plt.xticks(sizes)
    plt.xlabel("number of boxes n (k = n/2)")
    plt.ylabel("seconds (log scale)")
    plt.title(f"E5: brute force passes {limitSeconds} s at n = {sizes[-1]}")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.savefig("e5_bruteforce.png", dpi=200, bbox_inches="tight")
    plt.close()


# Run the experiments. To skip one, put # at the start of its line.
#e1()
#e2()
#e3()
e4()
e5()
print("Done. The graphs are saved as e1_size.png to e5_bruteforce.png in this folder.")
