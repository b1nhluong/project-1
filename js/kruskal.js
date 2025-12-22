class DSU {
    constructor(n) {
        this.parent = Array(n + 1).fill(0).map((_, i) => i); 
        this.rank = Array(n + 1).fill(0); 
    }

    find(i) {
        if (this.parent[i] === i) return i;
        this.parent[i] = this.find(this.parent[i]); 
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

function setupKruskalSteps(N, edges) {
    if (N <= 0 || edges.length === 0) return { steps: [], sortedEdges: [] };

    let sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
    sortedEdges = sortedEdges.map((edge, index) => ({ ...edge, id: index + 1 }));

    const dsu = new DSU(N);
    let mstEdges = [];
    let allSteps = [];

    allSteps.push({ 
        edgeIndex: -1, 
        edgeInfo: null,
        dsuSnapshot: dsu.getSnapshot(),
        log: `Algorithm Started. Graph has ${N} nodes and ${sortedEdges.length} edges.`,
        status: 'INITIAL' 
    });

    for (let i = 0; i < sortedEdges.length; i++) {
        const edge = sortedEdges[i];
        const { u, v, weight } = edge;

        allSteps.push({ 
            edgeIndex: i, 
            edgeInfo: edge,
            dsuSnapshot: dsu.getSnapshot(),
            mstEdges: [...mstEdges], 
            log: `Examining edge [${edge.id}] (${u}, ${v}), weight=${weight}.`,
            status: 'EXAMINING'
        });

        const rootU = dsu.find(u);
        const rootV = dsu.find(v);
        let statusLog, stepStatus;

        if (rootU !== rootV) {
            dsu.union(u, v);
            mstEdges.push(edge);
            statusLog = `ACCEPTED edge (${u}, ${v}). Merging sets ${rootU} and ${rootV}.`;
            stepStatus = 'SELECTED';
        } else {
            statusLog = `REJECTED edge (${u}, ${v}). Creates cycle (same root ${rootU}).`;
            stepStatus = 'REJECTED';
        }

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

    allSteps.push({
        edgeIndex: -1,
        edgeInfo: null,
        dsuSnapshot: dsu.getSnapshot(),
        mstEdges: [...mstEdges],
        log: `FINISHED. Total MST Weight: ${mstEdges.reduce((acc, e) => acc + e.weight, 0)}.`,
        status: 'FINAL'
    });

    return { steps: allSteps, sortedEdges: sortedEdges };
}
