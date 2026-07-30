# ---------------- DFS ----------------
class Node:
    def __init__(self, ten, Cha=None):
        self.ten = ten
        self.Cha = Cha

def kiemTra(tam, MO):
    for v in MO:
        if v.ten == tam.ten:
            return True
    return False

def DuongDi(n):
    print(n.ten)
    if n.Cha is not None:
        DuongDi(n.Cha)
    else:
        return

from collections import defaultdict
data = defaultdict(list)
data['A'] = ['B','C','D']
data['B'] = ['M','N']
data['C'] = ['L']
data['D'] = ['O','P']
data['M'] = ['X','Y']
data['N'] = ['U','V']
data['O'] = ['I','J']
data['Y'] = ['R','S']
data['V'] = ['G','H']

def DFS(To, Tg):
    MO = []
    DONG = []
    MO.append(To)
    while True:
        if len(MO) == 0:
            print('Tim kiem khong thanh cong')
            return
        n = MO.pop(0)
        if n.ten == Tg.ten:
            print('Tim thay duong di')
            DuongDi(n)
            return
        DONG.append(n)
        pos = 0
        for v in data[n.ten]:
            tam = Node(v)
            ok1 = kiemTra(tam, MO)
            ok2 = kiemTra(tam, DONG)
            if not ok1 and not ok2:
                MO.insert(pos, tam)
                pos += 1
                tam.Cha = n
# ---------------- BFS ----------------
class Node:
    def __init__(self, ten, Cha=None):
        self.ten = ten
        self.Cha = Cha

def kiemTra(tam, MO):
    for v in MO:
        if v.ten == tam.ten:
            return True
    return False

def DuongDi(n):
    print(n.ten)
    if n.Cha is not None:
        DuongDi(n.Cha)
    else:
        return

from collections import defaultdict
data = defaultdict(list)
data['A'] = ['B','C','D']
data['B'] = ['M','N']
data['C'] = ['L']
data['D'] = ['O','P']
data['M'] = ['X','Y']
data['N'] = ['U','V']
data['O'] = ['I','J']
data['Y'] = ['R','S']
data['V'] = ['G','H']

def BFS(To, Tg):
    MO = []
    DONG = []
    MO.append(To)
    while True:
        if len(MO) == 0:
            print('Tim kiem khong thanh cong')
            return
        n = MO.pop(0)
        if n.ten == Tg.ten:
            print('Tim kiem thanh cong')
            DuongDi(n)
            return
        DONG.append(n)
        for v in data[n.ten]:
            tam = Node(v)
            ok1 = kiemTra(tam, MO)
            ok2 = kiemTra(tam, DONG)
            if not ok1 and not ok2:
                MO.append(tam)
                tam.Cha = n
# ---------------- AT ----------------
def print_path_and_cost(start, goal, parent, g):
    path = []
    current = goal
    while current != start:
        path.append(current)
        current = parent[current]
    path.append(start)
    path.reverse()
    print("Đường đi:", ' -> '.join(path))
    print("C(p) =", g[goal])

def AT(graph, start, goals):
    MO = [start]
    g = {start: 0}
    DONG = []
    parent = {}
    while MO:
        min_cost = float('inf')
        for vertex in MO:
            cost = g.get(vertex, float('inf'))
            if cost < min_cost:
                min_cost = cost
                n = vertex
        if n in goals:
            print_path_and_cost(start, n, parent, g)
            return True
        MO.remove(n)
        DONG.append(n)
        for m in graph.get(n, {}):
            cost = graph[n][m]
            new_cost = g.get(n, float('inf')) + cost
            if m in parent and new_cost < g[m]:
                g[m] = new_cost
                parent[m] = n
            elif m not in MO and m not in DONG:
                g[m] = new_cost
                parent[m] = n
                MO.append(m)
    return False
# ---------------- A* ----------------
def h(node):
    h_values = {
        'A': 11,
        'B': 11,
        'C': 11,
        'D': 6,
        'E': 4,
        'F': 0,
        'Z': 0
    }
    return h_values[node]

def print_path_and_cost(start, goal, parent, g):
    path = []
    current = goal
    while current != start:
        path.append(current)
        current = parent[current]
    path.append(start)
    path.reverse()
    print("Đường đi:", ' -> '.join(path))
    print("C(p) =", g[goal])

def A_star(graph, start, goals):
    MO = [start]
    DONG = []
    g = {start: 0}
    f = {start: h(start)}
    parent = {}
    while MO:
        min_f = float('inf')
        min_node = None
        for node in MO:
            if f[node] < min_f:
                min_f = f[node]
                min_node = node
        n = min_node
        if n in goals:
            print_path_and_cost(start, n, parent, g)
            print(parent)
            return True
        MO.remove(n)
        DONG.append(n)
        for m, cost_g, cost_h in graph.get(n, []):
            cost_g_new = g[n] + cost_g
            if m not in MO and m not in DONG:
                g[m] = cost_g_new
                f[m] = g[m] + cost_h
                parent[m] = n
                MO.append(m)
            elif m in MO and g[m] > cost_g_new:
                g[m] = cost_g_new
                f[m] = g[m] + cost_h
                parent[m] = n
    return False

# ---------------- MAIN ----------------
if __name__ == "__main__":
    # Test DFS
    print("=== DFS Test ===")
    start = Node("A")
    goal = Node("R")
    DFS(start, goal)

    # Test BFS
    print("\n=== BFS Test ===")
    start = Node("A")
    goal = Node("N")
    BFS(start, goal)

    # Test AT
    print("\n=== AT Test ===")
    graph_AT = {
        "A": {"B": 2, "C": 4, "F": 6},
        "B": {},
        "C": {"D": 8, "E": 2},
        "D": {},
        "E": {},
        "F": {"G": 5, "H": 1},
        "G": {},
        "H": {}
    }
    AT(graph_AT, "A", ["D","H"])

    # Test A*
    print("\n=== A* Test ===")
    graph_Astar = {
        'A': [('B',4,11), ('C',3,11)],
        'B': [('F',5,11), ('E',12,4)],
        'C': [('D',7,6), ('E',10,4)],
        'D': [('E',2,4)],
        'E': [('Z',5,0)],
        'F': [('Z',16,0)] 
    }
    A_star(graph_Astar, 'A', ['Z','F'])



