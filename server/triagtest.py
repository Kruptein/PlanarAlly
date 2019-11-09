ID_TO_VERT = {}
VERT_TO_ID = {}
ID_TO_NEIGH = {}
NEIGH_TO_ID = {}

PTR_TO_VERT = {}
VERT_TO_PTR = {}
PTR_TO_NEIGH = {}
NEIGH_TO_PTR = {}

ID_TO_PTR = {}
PTR_TO_ID = {}

with open('ts', 'r') as f:
    for line in f:
        line = line.strip("\n")
        d = line.split("\t")
        _id = int(d[0])
        p0 = d[1].replace(",", " ").replace("100000000000", "1e+11").replace("-100000000000", "-1e11").replace("100000000", "1e+08").replace("-100000000", "-1e+08").replace("-Infinity", "0")
        p1 = d[2].replace(",", " ").replace("100000000000", "1e+11").replace("-100000000000", "-1e11").replace("100000000", "1e+08").replace("-100000000", "-1e+08").replace("-Infinity", "0")
        p2 = d[3].replace(",", " ").replace("100000000000", "1e+11").replace("-100000000000", "-1e11").replace("100000000", "1e+08").replace("-100000000", "-1e+08").replace("-Infinity", "0")
        ID_TO_VERT[_id] = [p0, p1, p2]
        VERT_TO_ID[(p0, p1, p2)] = _id
        n0, n1, n2 = int(d[4]), int(d[5]), int(d[6])
        ID_TO_NEIGH[_id] = [int(n0), int(n1), int(n2)]
        NEIGH_TO_ID[int(n0), int(n1), int(n2)] = _id

with open('cpp', 'r') as f:
    for line in f:
        line = line.strip("\n")
        d = line.split("\t")
        ptr = d[0]
        PTR_TO_VERT[ptr] = [d[1], d[2], d[3]]
        VERT_TO_PTR[(d[1], d[2], d[3])] = ptr
        PTR_TO_NEIGH[ptr] = [d[4], d[5], d[6]]
        NEIGH_TO_PTR[(d[4], d[5], d[6])] = ptr


def p2i(p):
    if p == '0': return 0
    return VERT_TO_ID[tuple(PTR_TO_VERT[p])]

def i2p(i):
    return VERT_TO_PTR[tuple(ID_TO_VERT[i])]

def comparetest():
    for i in ID_TO_VERT.keys():
        try:
            i2p(i)
        except:
            print(i)
    for p in PTR_TO_VERT.keys():
        try:
            p2i(p)
        except:
            print(p)

def ntest():
    for i in ID_TO_NEIGH.keys():
        try:
            if ID_TO_NEIGH[i] != [p2i(x) for x in PTR_TO_NEIGH[i2p(i)]]:
                print(i, i2p(i))
        except:
            print(f"E {i}, {i2p(i)}")


if __name__ == '__main__':
    comparetest()
    ntest()