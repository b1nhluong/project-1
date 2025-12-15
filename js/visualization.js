// Biến toàn cục
let network = null;
let graphNodes = null;
let graphEdges = null;
let initialEdges = []; 

/**
 * Vẽ đồ thị ban đầu từ dữ liệu input
 */
function drawInitialGraph(data) {
    const container = document.getElementById('graph-container');
    
    // Kiểm tra thư viện
    if (typeof vis === 'undefined') {
        container.innerHTML = `<p style="color:red; font-weight:bold;">Lỗi: Không tìm thấy thư viện Vis.js.</p>`;
        return;
    }

    container.innerHTML = ''; 

    graphNodes = new vis.DataSet();
    graphEdges = new vis.DataSet();
    initialEdges = [];

    // 1. Tạo Đỉnh
    try {
        for (let i = 1; i <= data.N; i++) {
            graphNodes.add({ 
                id: i, 
                label: `${i}`, 
                color: { background: '#3498db', border: '#2980b9' }, 
                font: { color: 'white', size: 20 }
            });
        }

        // 2. Tạo Cạnh
        data.edges.forEach((edge, index) => {
            const edgeId = `e${index}`; 
            
            graphEdges.add({
                id: edgeId,
                from: edge.u, 
                to: edge.v,
                label: edge.weight.toString(),
                color: { color: '#bdc3c7' }, 
                width: 2, 
                // Font chữ cho trọng số
                font: { align: 'top', size: 14, strokeWidth: 2, strokeColor: '#fff', color: '#333' }
            });

            initialEdges.push({ u: edge.u, v: edge.v, weight: edge.weight, visId: edgeId });
        });
    } catch (err) {
        console.error("Lỗi Vis.js:", err);
        return;
    }

    // 3. Cấu hình Vis.js (TỐI ƯU HÓA HIỆU NĂNG)
    const options = {
        // Tắt tính năng người dùng tự chọn (click)
        nodes: { chosen: false },
        edges: { 
            chosen: false,
            smooth: false // Vẽ đường thẳng thay vì đường cong -> Giảm lag cực nhiều
        },
        physics: {
            enabled: true,
            solver: 'barnesHut', // Thuật toán nhẹ nhất
            barnesHut: {
                gravitationalConstant: -2000,
                centralGravity: 0.3,
                springLength: 95
            },
            stabilization: {
                enabled: true,
                iterations: 1000,
                updateInterval: 50
            }
        },
        interaction: { 
            dragNodes: true, 
            zoomView: true,  
            dragView: true,
            selectable: false, // Tắt hoàn toàn việc chọn
            hover: false,      // Tắt hiệu ứng hover để giảm tải CPU
            hideEdgesOnDrag: true // Ẩn cạnh khi kéo đồ thị -> Siêu mượt
        },
        layout: {
            randomSeed: 2
        }
    };

    network = new vis.Network(container, { nodes: graphNodes, edges: graphEdges }, options);
    
    // [QUAN TRỌNG] Đóng băng vật lý sau khi đồ thị đã ổn định
    network.once("stabilizationIterationsDone", function() {
        network.setOptions({ physics: { enabled: false } }); 
        network.fit();
        console.log("Đã đóng băng vật lý để tối ưu hiệu năng.");
    });

    console.log(`Đã vẽ đồ thị: ${data.N} đỉnh, ${data.M} cạnh.`);
}

/**
 * Cập nhật hiển thị theo trạng thái thuật toán
 */
function updateGraphVisualization(state) {
    if (!network || !graphNodes || !graphEdges) return;

    // 1. Cập nhật màu Đỉnh
    const colorPalette = ['#3498db', '#9b59b6', '#e67e22', '#e74c3c', '#1abc9c', '#2ecc71', '#f1c40f', '#34495e'];
    if (state.dsuSnapshot) {
        const nodesUpdate = [];
        state.dsuSnapshot.forEach((root, nodeId) => {
            if (nodeId === 0) return;
            const color = colorPalette[root % colorPalette.length];
            
            nodesUpdate.push({
                id: nodeId,
                color: { background: color, border: color },
                borderWidth: (root === nodeId) ? 4 : 1
            });
        });
        graphNodes.update(nodesUpdate);
    }

    // 2. Cập nhật màu Cạnh
    const edgeUpdates = [];
    
    const mstVisIds = new Set();
    if (state.mstEdges) {
        state.mstEdges.forEach(e => {
            const found = initialEdges.find(ie => 
                (ie.u === e.u && ie.v === e.v && ie.weight === e.weight) || 
                (ie.u === e.v && ie.v === e.u && ie.weight === e.weight)
            );
            if (found) mstVisIds.add(found.visId);
        });
    }

    let currentVisId = null;
    if (state.edgeInfo) {
        const { u, v, weight } = state.edgeInfo;
        const found = initialEdges.find(ie => 
            (ie.u === u && ie.v === v && ie.weight === weight) || 
            (ie.u === v && ie.v === u && ie.weight === weight)
        );
        if (found) currentVisId = found.visId;
    }

    graphEdges.getIds().forEach(visId => {
        let newColor = '#bdc3c7'; 
        let newWidth = 2;

        if (mstVisIds.has(visId)) {
            newColor = '#2ecc71'; 
            newWidth = 4;
        } 
        else if (visId === currentVisId && state.status !== 'FINAL') {
            if (state.status === 'REJECTED') {
                newColor = '#e74c3c'; 
            } else {
                newColor = '#f1c40f'; 
            }
            newWidth = 4;
        }

        edgeUpdates.push({ id: visId, color: { color: newColor, highlight: newColor }, width: newWidth });
    });

    graphEdges.update(edgeUpdates);
}