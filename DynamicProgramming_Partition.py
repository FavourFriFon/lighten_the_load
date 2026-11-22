INF = float("inf")

def DynamicProgramming_Partition(arr, k, L = None):
    n = len(arr)
    if not 1 <= k <= n:
        raise ValueError("k must be between 1 and len(arr)")
    if L is not None and k * L < n:
        return None

    P = [0] * (n + 1)
    for i in range(1, n + 1):
        P[i] = P[i - 1] + arr[i - 1]

    M = [[INF] * (k + 1) for _ in range(n + 1)]
    cut = [[0] * (k + 1) for _ in range(n + 1)]
    M[0][0] = 0

    for i in range(1, n + 1):
        for j in range(1, min(i, k) + 1):
            start = j - 1 if L is None else max(j - 1, i - L)
            for l in range(start, i):
                cand = max(M[l][j - 1], P[i] - P[l])
                if cand < M[i][j]:
                    M[i][j] = cand
                    cut[i][j] = l

    if M[n][k] == INF:
        return None

    batches = []
    i = n
    for j in range(k, 0, -1):
        l = cut[i][j]
        batches.append(arr[l:i])
        i = l
    batches.reverse()
    return M[n][k], batches

if __name__ == "__main__":
    arr = [7, 2, 5, 10, 8]
    print(DynamicProgramming_Partition(arr, 2))
    print(DynamicProgramming_Partition(arr, 3))
    print(DynamicProgramming_Partition([1, 1, 1, 10], 3))
    print(DynamicProgramming_Partition(arr, 3, L = 2))
    print(DynamicProgramming_Partition(arr, 2, L = 2))
