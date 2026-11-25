"""One place that gives every method the same shape: method(w, k) -> (answer, groups).

The owners' files keep their own function names; this file only adapts them.
"""
from exhaustive import bruteForce
from DynamicProgramming_Partition import DynamicProgramming_Partition
from binsearch import solve as binarySearchSolve

METHODS = {
    "brute force": bruteForce,
    "DP": DynamicProgramming_Partition,
    "binary search": binarySearchSolve,
}

# Brute force is too slow beyond this size (measured stopping point: n = 28 took over 60 s).
BRUTE_FORCE_MAX_N = 26
