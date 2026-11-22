def sums(w):
    """Return P where P[0] = 0 and P[i] = w[0] + ... + w[i-1].  len(P) == len(w) + 1."""
    prefix = [0]
    for weight in w:
        prefix.append(prefix[-1] + weight)
    return prefix


def bruteForce(w, k):
    n = len(w)
    if not 1 <= k <= n:
        raise ValueError("k must be between 1 and len(w)")

    P = sums(w)
    best = math.inf
    bestCuts = None

    for chosen in combinations(range(1, n), k - 1):
        cuts = [0] + list(chosen) + [n]
        largest = max(P[cuts[j]] - P[cuts[j - 1]] for j in range(1, k + 1))
        if largest < best:
            best = largest
            bestCuts = cuts

    groups = [w[bestCuts[j - 1]:bestCuts[j]] for j in range(1, k + 1)]
    return best, groups

def checkSplit(w, k, answer, groups):
    if len(groups) != k:
        return False, f"expected {k} groups, got {len(groups)}"
    if any(len(group) == 0 for group in groups):
        return False, "empty group"
    if [weight for group in groups for weight in group] != w:
        return False, "boxes missing, repeated or out of order"
    heaviest = max(sum(group) for group in groups)
    if heaviest != answer:
        return False, f"heaviest group is {heaviest}, but reported {answer}"
    return True, "ok"
