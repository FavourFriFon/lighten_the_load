def feasible(weights, k, X):
    """Return True if the boxes can be packed, in order, into at most k bags
    of capacity X. Assumes X >= max(weights)."""
    count = 1          # bags used so far (we always open the first bag)
    current = 0        # weight in the current bag
    for w in weights:
        if current + w > X:      # box doesn't fit: close bag, start a new one
            count += 1
            current = w
        else:
            current += w
    return count <= k


def binary_search_partition(weights, k, verbose=False):
    """Return the minimum possible largest batch sum when splitting
    `weights` (in order) into k consecutive groups. O(n log S) time."""
    lo, hi = max(weights), sum(weights)
    rnd = 0
    while lo < hi:
        mid = (lo + hi) // 2
        ok = feasible(weights, k, mid)
        rnd += 1
        if verbose:
            print(f"Round {rnd}: range [{lo}, {hi}], guess {mid} -> {'Pass' if ok else 'Fail'}")
        if ok:
            hi = mid           # answer is mid or smaller
        else:
            lo = mid + 1       # answer is strictly bigger
    return lo


def recover_groups(weights, k, X):
    """Pack in order with limit X, closing a bag early when the boxes left
    are only just enough for the bags still needed, so we return exactly k groups."""
    n = len(weights)
    groups, current, cur_sum = [], [], 0
    for i, w in enumerate(weights):
        boxes_left = n - i               # boxes not yet placed, including this one
        bags_left = k - len(groups)      # bags not yet closed, including the open one
        # Close the open bag if this box won't fit, OR if adding it would leave
        # too few boxes to give every remaining bag at least one box.
        if current and (cur_sum + w > X or boxes_left < bags_left):
            groups.append(current)
            current, cur_sum = [], 0
        current.append(w)
        cur_sum += w
    groups.append(current)
    return groups

def solve(weights, k):
    """Full solution: the optimal value and one optimal split into exactly k groups."""
    best = binary_search_partition(weights, k)
    return best, recover_groups(weights, k, best)


def feasible_L(weights, k, X, L):
    """Packing check with weight limit X AND at most L boxes per bag."""
    count, current, size = 1, 0, 0
    for w in weights:
        if current + w > X or size == L:   # over weight OR bag already full of boxes
            count += 1
            current, size = w, 1
        else:
            current += w
            size += 1
    return count <= k

def binary_search_partition_L(weights, k, L):
    """Minimum largest batch sum with at most L boxes per group.
    Returns None if no valid split exists (k * L < n)."""
    if k * L < len(weights):
        return None
    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible_L(weights, k, mid, L):
            hi = mid
        else:
            lo = mid + 1
    return lo
