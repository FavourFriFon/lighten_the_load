# lighten_the_load
# CS456 A11: Splitting Workloads into Consecutive Batches

Given positive integer workloads w1, …, wn in a fixed order and an integer k with 1 ≤ k ≤ n,
split them into exactly k nonempty consecutive batches so that the heaviest batch is as light
as possible.

Example: `[7, 2, 5, 10, 8]` with k = 2 gives `[7, 2, 5] | [10, 8]`, with heaviest batch 18.

We solve the problem three ways and check that they always agree.

| Method | File | Author | Time | Extra space |
| --- | --- | --- | --- | --- |
| Brute force (Part i) | `exhaustive.py` | Suzie | O(C(n−1, k−1) · k) | O(n) |
| Dynamic programming (Part ii) | `DynamicProgramming_Partition.py` | Joycelyn | O(k n²) | O(k n) |
| Binary search (Parts iii and iv) | `binsearch.py` | Donna | O(n log S) | O(n) |

S is the total of all workloads. Every method returns `(answer, groups)`: the heaviest batch,
and the k batches themselves.

## Files

| File | What it does |
| --- | --- |
| `exhaustive.py` | Brute force, plus `checkSplit`, which checks any answer is valid |
| `DynamicProgramming_Partition.py` | Dynamic programming, including the at-most-L-tasks extension |
| `binsearch.py` | Packing check, binary search, exactly-k recovery, and the extension (`solve_L`) |
| `methods.py` | Gives the three methods one shared name and shape, so they can be used interchangeably |
| `main.py` | Runs all the correctness tests |
| `experiments.py` | Runs experiments E1 to E5 and saves the graphs |
| `brute Force.ipynb` | Step-by-step walkthrough of brute force, the checker and the stopping point |
| `binary_search_sol.ipynb` | Step-by-step walkthrough of the packing check, binary search and the extension |

The `.py` files contain the code used for all tests and experiments. The brute force and binary
search functions are copied from the notebooks so that `main.py` can import them; the notebooks
show how they were developed.

## Requirements

- Python 3.9 or newer
- `matplotlib` and `numpy`, for the experiments only:

```
pip install matplotlib numpy
```

## Running the tests

From the repository folder:

```
python main.py
```

This runs:

1. **Hand-checked examples** on all three methods, such as `[7, 2, 5, 10, 8]` with k = 2 (answer 18).
2. **1,000 random inputs** (up to 12 tasks, fixed seed 456). DP and binary search must match
   brute force, and every answer must pass `checkSplit`: exactly k batches, none empty, every task
   used once in its original order, and the heaviest batch equal to the reported answer.
3. **The extension** (at most L tasks per batch), including a case with no valid split.
4. **Bad input:** every method must reject an impossible k with a `ValueError`.

Every line should say PASS, and the random checks should report 0 failures.

## Reproducing the experiments

```
python experiments.py
```

This takes about 25 minutes, mostly E5. Each experiment times the methods (median of 5 runs;
3 for DP in E3 and E4; 1 for brute force in E5) and saves a graph in the repository folder.To skip it, put # in front of e5() at the bottom of experiments.py
Inputs come from fixed random seeds, so they are the same on every machine. Times differ between
machines, but the growth patterns should match.

| Experiment | What changes | Held fixed | Graph |
| --- | --- | --- | --- |
| E1 Input size | n = 256 to 2,048 for DP; 1,024 to 262,144 for binary search | k = 10, weights 1 to 1,000 | `e1_size.png` |
| E2 Number of batches | k = 2 to 200 | n = 400 | `e2_groups.png` |
| E3 Size of the weights | largest weight 10 to 10⁹ | n = 1,000, k = 10 | `e3_weights.png` |
| E4 Input shape | random, sorted, all equal, one spike, heavy-tailed | n = 1,000, k = 10 | `e4_patterns.png` |
| E5 Brute force limit | n = 10, 12, … until one run takes over 60 seconds | k = n/2 | `e5_bruteforce.png` |

To run only some experiments, put `#` in front of the others' lines (`e1()` to `e5()`) at the
bottom of `experiments.py`.

**Main findings:** DP's running time grows like n² and binary search's like n (log-log slopes
near 2 and 1). Binary search's number of rounds follows log₂ S exactly. Input shape changes running
times by less than a factor of 2. Brute force passed 60 seconds at n = [E5 result] on our test laptop.

## Team

- **Suzie:** brute force, answer checker, tests
- **Joycelyn:** dynamic programming 
- **Donna:** binary search
- **Favour:** problem formulation, integration (`methods.py`, `main.py`), the extension's group recovery (`solve_L`), experiments and graphs, README


