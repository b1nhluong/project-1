let currentStep = 0;
let allKruskalSteps = [];
let graphData = { N: 0, M: 0, edges: [] };
let isAutoRunning = false;
let autoRunInterval = null;
let speed = 500;

function updateSpeedDisplay(val) {
    speed = parseInt(val);
    document.getElementById('speedDisplay').textContent = speed;
    if (isAutoRunning) {
        clearInterval(autoRunInterval);
        autoRunInterval = setInterval(nextStep, speed);
    }
}

/* --- XỬ LÝ FILE --- */
function handleFileSelect() {
    const file = document.getElementById('fileInput').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            window.fileContent = e.target.result;
            document.getElementById('processButton').disabled = false;
            logMessage(`Đã tải file: ${file.name}`, 'info');
        };
        reader.readAsText(file);
    }
}

function processInput() {
    clearGraph(false); // Reset nhưng giữ input
    if (!window.fileContent) return;

    const lines = window.fileContent.trim().split('\n').filter(l => l.trim());
    const [N, M] = lines[0].trim().split(/\s+/).map(Number);
    
    if (!N || N <= 0) { logMessage('Lỗi: Số đỉnh N không hợp lệ.', 'error'); return; }

    const edges = [];
    for (let i = 1; i < lines.length; i++) {
        const [u, v, w] = lines[i].trim().split(/\s+/).map(Number);
        if (u && v && !isNaN(w)) edges.push({ u, v, weight: w });
    }

    graphData = { N, M, edges };
    drawInitialGraph(graphData);
    
    document.getElementById('sortButton').disabled = false;
    document.getElementById('processButton').disabled = true;
    logMessage(`Dữ liệu OK: ${N} đỉnh, ${edges.length} cạnh.`, 'success');
}

function sortEdges() {
    if (!graphData.edges.length) return;
    
    const res = setupKruskalSteps(graphData.N, graphData.edges);
    allKruskalSteps = res.steps;
    
    // Render bảng cạnh
    const tbody = document.getElementById('edgeTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    res.sortedEdges.forEach(e => {
        const row = tbody.insertRow();
        row.id = `edge-row-${e.id}`;
        row.innerHTML = `<td>${e.id}</td><td>${e.u} - ${e.v}</td><td>${e.weight}</td><td>-</td>`;
    });

    document.getElementById('sortButton').disabled = true;
    document.getElementById('stepButton').disabled = false;
    document.getElementById('runButton').disabled = false;
    document.getElementById('resetStepsButton').disabled = false;
    
    logMessage('Đã sắp xếp cạnh. Sẵn sàng chạy.', 'success');
}

/* --- ĐIỀU KHIỂN CHẠY --- */
function nextStep() {
    if (currentStep >= allKruskalSteps.length) {
        stopAutoRun();
        document.getElementById('stepButton').disabled = true;
        return;
    }

    const state = allKruskalSteps[currentStep];
    updateInterface(state);
    
    currentStep++;
    document.getElementById('prevButton').disabled = (currentStep <= 1);
}

function prevStep() {
    if (currentStep <= 1) return;
    stopAutoRun();

    // Logic lùi bước: currentStep đang trỏ vào bước "sắp tới".
    // Cần lùi về bước hiện tại (-1), rồi lùi về bước trước đó (-1) => Trừ 2.
    currentStep -= 2;
    
    const state = allKruskalSteps[currentStep];
    updateInterface(state);
    
    currentStep++; // Chuẩn bị cho nextStep
    
    document.getElementById('stepButton').disabled = false;
    document.getElementById('prevButton').disabled = (currentStep <= 1);
}

function toggleAutoRun() {
    if (isAutoRunning) {
        stopAutoRun();
    } else {
        if (currentStep >= allKruskalSteps.length) return;
        isAutoRunning = true;
        document.getElementById('runButton').textContent = 'Stop';
        document.getElementById('stepButton').disabled = true;
        document.getElementById('prevButton').disabled = true;
        autoRunInterval = setInterval(nextStep, speed);
    }
}

function stopAutoRun() {
    isAutoRunning = false;
    clearInterval(autoRunInterval);
    document.getElementById('runButton').textContent = 'Auto run';
    if (currentStep < allKruskalSteps.length) document.getElementById('stepButton').disabled = false;
    if (currentStep > 1) document.getElementById('prevButton').disabled = false;
}

/* --- CÁC HÀM RESET --- */

// 1. Chỉ đặt lại quá trình chạy (giữ nguyên đồ thị)
function resetSteps() {
    stopAutoRun();
    currentStep = 0;
    
    if (allKruskalSteps.length > 0) {
        // Reset bảng
        const tbody = document.getElementById('edgeTable').getElementsByTagName('tbody')[0];
        Array.from(tbody.rows).forEach(r => { r.className = ''; r.cells[3].textContent = '-'; });
        
        // Hiển thị bước 0 (Initial)
        updateInterface(allKruskalSteps[0]);
        currentStep = 1;
        
        document.getElementById('stepButton').disabled = false;
        document.getElementById('runButton').disabled = false;
        document.getElementById('prevButton').disabled = true;
        logMessage('Đã đặt lại quá trình chạy.', 'info');
    }
}

// 2. Xóa toàn bộ dữ liệu và đồ thị
function clearGraph(resetInput = true) {
    stopAutoRun();
    currentStep = 0;
    allKruskalSteps = [];
    
    document.getElementById('edgeTable').getElementsByTagName('tbody')[0].innerHTML = '';
    document.getElementById('dsuTable').getElementsByTagName('tbody')[0].innerHTML = '';
    document.getElementById('graph-container').innerHTML = '<p>The graph will appear here after you enter the data.</p>';
    
    if (resetInput) {
        window.fileContent = null;
        document.getElementById('fileInput').value = '';
        document.getElementById('processButton').disabled = true;
        graphData = { N: 0, M: 0, edges: [] };
    }

    document.getElementById('sortButton').disabled = true;
    document.getElementById('stepButton').disabled = true;
    document.getElementById('runButton').disabled = true;
    document.getElementById('prevButton').disabled = true;
    document.getElementById('resetStepsButton').disabled = true;
    
    if(resetInput) logMessage('Deleted all the data.', 'info');
}

/* --- CẬP NHẬT GIAO DIỆN --- */
function updateInterface(state) {
    // 1. Log
    logMessage(state.log, state.status === 'SELECTED' ? 'success' : (state.status === 'REJECTED' ? 'error' : 'info'));
    
    // 2. Bảng Cạnh (Highlight hàng)
    const tbody = document.getElementById('edgeTable').getElementsByTagName('tbody')[0];
    Array.from(tbody.rows).forEach(r => r.classList.remove('edge-examining')); // Xóa highlight 'đang xét' cũ
    
    if (state.edgeInfo) {
        const row = document.getElementById(`edge-row-${state.edgeInfo.id}`);
        if (row) {
            if (state.status === 'SELECTED') {
                row.className = 'edge-selected';
                row.cells[3].textContent = 'selected';
            } else if (state.status === 'REJECTED') {
                row.className = 'edge-rejected';
                row.cells[3].textContent = 'rejected';
            } else if (state.status === 'EXAMINING') {
                row.className = 'edge-examining';
                row.cells[3].textContent = 'examining';
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // 3. Bảng DSU
    if (state.dsuSnapshot) {
        const dsuBody = document.getElementById('dsuTable').getElementsByTagName('tbody')[0];
        dsuBody.innerHTML = '';
        state.dsuSnapshot.forEach((p, i) => {
            if (i > 0) {
                const r = dsuBody.insertRow();
                r.innerHTML = `<td>${i}</td><td>${p}</td>`;
            }
        });
    }

    // 4. Vẽ đồ thị
    updateGraphVisualization(state);
}

function logMessage(msg, type) {
    const log = document.getElementById('messageLog');
    const color = type === 'error' ? 'red' : (type === 'success' ? 'green' : '#333');
    log.innerHTML = `<p style="color:${color}">[${new Date().toLocaleTimeString()}] ${msg}</p>` + log.innerHTML;
}

window.onload = () => { clearGraph(true); };
