function setupPrimSteps(N, inputEdges) {
    if (N <= 0 || inputEdges.length === 0) return { steps: [], sortedEdges: [] };

    const adj = Array.from({ length: N + 1 }, () => []);
    
    let sortedEdges = [...inputEdges].sort((a, b) => a.weight - b.weight);
    sortedEdges = sortedEdges.map((edge, index) => ({ ...edge, id: index + 1 }));

    sortedEdges.forEach(e => {
        adj[e.u].push({ to: e.v, weight: e.weight, id: e.id });
        adj[e.v].push({ to: e.u, weight: e.weight, id: e.id });
    });

    let allSteps = [];
    let mstEdges = [];
    
    let parent = Array(N + 1).fill(-1);
    let dist = Array(N + 1).fill(Infinity);
    let visited = Array(N + 1).fill(false);

    dist[1] = 0;

    allSteps.push({
        status: 'INITIAL',
        log: `Starting Prim's Algorithm from Node 1.`,
        primSnapshot: { dist: [...dist], parent: [...parent], visited: [...visited] },
        mstEdges: []
    });

    for (let count = 0; count < N; count++) {
        let u = -1;
        let minDist = Infinity;

        for (let i = 1; i <= N; i++) {
            if (!visited[i] && dist[i] < minDist) {
                minDist = dist[i];
                u = i;
            }
        }

        if (u === -1) break;

        visited[u] = true;

        let edgeInfo = null;
        if (parent[u] !== -1) {
            const edgeObj = sortedEdges.find(e => 
                (e.u === u && e.v === parent[u]) || (e.u === parent[u] && e.v === u)
            );
            if (edgeObj) {
                mstEdges.push(edgeObj);
                edgeInfo = edgeObj;
            }
        }

        allSteps.push({
            status: 'SELECTED_NODE',
            edgeInfo: edgeInfo,
            primSnapshot: { dist: [...dist], parent: [...parent], visited: [...visited] },
            mstEdges: [...mstEdges],
            log: `Selected Node ${u} (Min Dist: ${minDist}). Added to MST.`,
            selectedNode: u 
        });

        for (let edge of adj[u]) {
            let v = edge.to;
            let w = edge.weight;

            if (!visited[v] && w < dist[v]) {
                dist[v] = w;
                parent[v] = u;

                allSteps.push({
                    status: 'UPDATE_DIST',
                    edgeInfo: { id: edge.id, u: u, v: v, weight: w },
                    primSnapshot: { dist: [...dist], parent: [...parent], visited: [...visited] },
                    mstEdges: [...mstEdges],
                    log: `Updating Node ${v}: Dist reduced to ${w} via Parent ${u}.`,
                    selectedNode: u 
                });
            }
        }
    }

    allSteps.push({
        status: 'FINAL',
        primSnapshot: { dist: [...dist], parent: [...parent], visited: [...visited] },
        mstEdges: [...mstEdges],
        log: `FINISHED. Total MST Weight: ${mstEdges.reduce((acc, e) => acc + e.weight, 0)}.`,
        edgeInfo: null
    });

    return { steps: allSteps, sortedEdges: sortedEdges };
}
