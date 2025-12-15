/**
 * Lớp DSU (Disjoint Set Union)
 */
class DSU {
    constructor(n) {
        this.parent = Array(n + 1).fill(0).map((_, i) => i); 
        this.rank = Array(n + 1).fill(0); 
    }

    find(i) {
        if (this.parent[i] === i) return i;
        this.parent[i] = this.find(this.parent[i]); // Path compression
        return this.parent[i];
    }

    union(i, j) {
        let rootI = this.find(i);
        let rootJ = this.find(j);

        if (rootI !== rootJ) {
            if (this.rank[rootI] < this.rank[rootJ]) {
                this.parent[rootI] = rootJ;
            } else if (this.rank[rootI] > this.rank[rootJ]) {
                this.parent[rootJ] = rootI;
            } else {
                this.parent[rootJ] = rootI;
                this.rank[rootI]++;
            }
            return true;
        }
        return false;
    }

    getSnapshot() { return [...this.parent]; }
}

/**
 * Logic chính của thuật toán Kruskal
 */
function setupKruskalSteps(N, edges) {
    if (N <= 0 || edges.length === 0) return { steps: [], sortedEdges: [] };

    // 1. Sắp xếp cạnh
    let sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
    sortedEdges = sortedEdges.map((edge, index) => ({ ...edge, id: index + 1 }));

    const dsu = new DSU(N);
    let mstEdges = [];
    let allSteps = [];

    // Bước khởi tạo
    allSteps.push({ 
        edgeIndex: -1, 
        edgeInfo: null,
        dsuSnapshot: dsu.getSnapshot(),
        log: `Bắt đầu. Đồ thị có ${N} đỉnh, ${sortedEdges.length} cạnh.`,
        status: 'INITIAL' 
    });

    // 2. Duyệt qua từng cạnh
    for (let i = 0; i < sortedEdges.length; i++) {
        const edge = sortedEdges[i];
        const { u, v, weight } = edge;

        // Trạng thái: Đang xem xét
        allSteps.push({ 
            edgeIndex: i, 
            edgeInfo: edge,
            dsuSnapshot: dsu.getSnapshot(),
            mstEdges: [...mstEdges], // Giữ nguyên danh sách MST hiện tại
            log: `Đang xét cạnh [${edge.id}] (${u}, ${v}), w=${weight}.`,
            status: 'EXAMINING'
        });

        const rootU = dsu.find(u);
        const rootV = dsu.find(v);
        let statusLog, stepStatus;

        if (rootU !== rootV) {
            dsu.union(u, v);
            mstEdges.push(edge);
            statusLog = `CHẤP NHẬN cạnh (${u}, ${v}). Hợp nhất tập hợp ${rootU} và ${rootV}.`;
            stepStatus = 'SELECTED';
        } else {
            statusLog = `LOẠI BỎ cạnh (${u}, ${v}). Tạo chu trình (cùng gốc ${rootU}).`;
            stepStatus = 'REJECTED';
        }

        // Trạng thái: Sau khi quyết định
        allSteps.push({ 
            edgeIndex: i, 
            edgeInfo: edge,
            dsuSnapshot: dsu.getSnapshot(),
            mstEdges: [...mstEdges], 
            log: statusLog,
            status: stepStatus
        });

        if (mstEdges.length === N - 1) break; 
    }

    // Bước hoàn tất
    allSteps.push({
        edgeIndex: -1,
        edgeInfo: null,
        dsuSnapshot: dsu.getSnapshot(),
        mstEdges: [...mstEdges],
        log: `HOÀN THÀNH. Tổng trọng số MST: ${mstEdges.reduce((acc, e) => acc + e.weight, 0)}.`,
        status: 'FINAL'
    });

    return { steps: allSteps, sortedEdges: sortedEdges };
}