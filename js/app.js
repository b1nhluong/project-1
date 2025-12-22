let currentStep = 0;
let allSteps = [];
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

/* --- RANDOM GENERATOR --- */
function generateRandomInput(N, density = 1.5) {
    let minEdges = N - 1; 
    let M = Math.floor(N * density);
    if (M < minEdges) M = minEdges;

    let output = `${N} ${M}\n`;
    let count = 0;

    for (let i = 1; i < N; i++) {
        let w = Math.floor(Math.random() * 100) + 1; 
        output += `${i} ${i+1} ${w}\n`;
        count++;
    }

    while (count < M) {
        let u = Math.floor(Math.random() * N) + 1;
        let v = Math.floor(Math.random() * N) + 1;
        if (u !== v) {
            let w = Math.floor(Math.random() * 100) + 1;
            output += `${u} ${v} ${w}\n`;
            count++;
        }
    }
    return output;
}

function generateAndLoad() {
    const inputEl = document.getElementById('nodeCountInput');
    let N = parseInt(inputEl.value);

    if (isNaN(N) || N < 2) {
        alert("Please enter a valid number of nodes (N >= 2).");
        return;
    }
    if (N > 1000) {
        if(!confirm("Creating a graph with > 1000 nodes may slow down the browser. Continue?")) return;
    }

    const content = generateRandomInput(N);
    window.fileContent = content;
    
    logMessage(`Generated random graph: ${N} nodes.`, 'info');
    document.getElementById('processButton').disabled = false;
    processInput(); 
}

/* --- FILE INPUT --- */
function triggerFileInput() {
    document.getElementById('fileInput').click();
}

function handleFileSelect() {
    const file = document.getElementById('fileInput').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            window.fileContent = e.target.result;
            document.getElementById('processButton').disabled = false;
            logMessage(`File loaded: ${file.name}`, 'info');
        };
        reader.readAsText(file);
    }
}

/* --- PROCESS DATA --- */
function processInput() {
    clearGraph(false); 

    if (!window.fileContent) return;

    const lines = window.fileContent.trim().split('\n').filter(l => l.trim());
    const [N, M] = lines[0].trim().split(/\s+/).map(Number);
    
    if (!N || N <= 0) { logMessage('Error: Invalid number of nodes (N).', 'error'); return; }

    const edges = [];
    for (let i = 1; i < lines.length; i++) {
        const [u, v, w] = lines[i].trim().split(/\s+/).map(Number);
        if (u && v && !isNaN(w) && u >= 1 && v >= 1 && u <= N && v <= N) { 
            edges.push({ u, v, weight: w });
        }
    }

    graphData = { N, M, edges };
    drawInitialGraph(graphData);
    
    document.getElementById('sortButton').disabled = false;
    document.getElementById('processButton').disabled = true;
    logMessage(`Data OK: ${N} nodes, ${edges.length} edges.`, 'success');
}

/* --- ALGORITHM PREPARATION --- */
function prepareAlgorithm() {
    if (!graphData.edges.length) return;
    
    const algoType = document.getElementById('algorithmSelect').value;
    let res;

    if (algoType === 'kruskal') {
        res = setupKruskalSteps(graphData.N, graphData.edges);
        document.getElementById('statusTableTitle').textContent = "DSU Status";
        document.getElementById('subTableTitle').textContent = "Set (Parent Array)";
        document.getElementById('statusTableHead').innerHTML = `<tr><th>Node</th><th>Root (Parent)</th></tr>`;
    } else {
        res = setupPrimSteps(graphData.N, graphData.edges);
        document.getElementById('statusTableTitle').textContent = "Prim Status";
        document.getElementById('subTableTitle').textContent = "Distance & Parent";
        document.getElementById('statusTableHead').innerHTML = `<tr><th>Node</th><th>Dist</th><th>Parent</th></tr>`;
    }

    allSteps = res.steps;
    
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
    
    logMessage(`Algorithm [${algoType.toUpperCase()}] prepared. Ready to run.`, 'success');
}

/* --- CONTROLS --- */
function nextStep() {
    if (currentStep >= allSteps.length) {
        logMessage('Algorithm finished.', 'info');
        stopAutoRun();
        document.getElementById('stepButton').disabled = true;
        return;
    }

    const state = allSteps[currentStep];
    updateInterface(state);
    
    currentStep++;
    document.getElementById('prevButton').disabled = (currentStep <= 1);
}

function prevStep() {
    if (currentStep <= 1) return;
    stopAutoRun();

    currentStep -= 2;
    
    const state = allSteps[currentStep];
    updateInterface(state);
    
    currentStep++; 
    
    document.getElementById('stepButton').disabled = false;
    document.getElementById('prevButton').disabled = (currentStep <= 1);
}

function toggleAutoRun() {
    if (isAutoRunning) {
        stopAutoRun();
        document.getElementById('runButton').textContent = 'Auto Run';
    } else {
        if (currentStep >= allSteps.length) return;
        isAutoRunning = true;
        document.getElementById('runButton').textContent = 'Pause';
        document.getElementById('stepButton').disabled = true;
        document.getElementById('prevButton').disabled = true;
        autoRunInterval = setInterval(nextStep, speed);
    }
}

function stopAutoRun() {
    isAutoRunning = false;
    clearInterval(autoRunInterval);
    document.getElementById('runButton').textContent = 'Auto Run';
    if (currentStep < allSteps.length) document.getElementById('stepButton').disabled = false;
    if (currentStep > 1) document.getElementById('prevButton').disabled = false;
}

function resetSteps() {
    stopAutoRun();
    currentStep = 0;
    
    if (allSteps.length > 0) {
        const tbody = document.getElementById('edgeTable').getElementsByTagName('tbody')[0];
        Array.from(tbody.rows).forEach(r => { 
            r.classList.remove('edge-selected', 'edge-rejected', 'edge-examining'); 
            r.cells[3].textContent = '-'; 
        });
        
        document.getElementById('sortButton').disabled = false;
        document.getElementById('dsuTable').getElementsByTagName('tbody')[0].innerHTML = '';

        logMessage('Algorithm reset. Please click "Prepare" again to start.', 'info');
        document.getElementById('stepButton').disabled = true;
        document.getElementById('runButton').disabled = true;
    }
}

function clearGraph(resetInput = true) {
    stopAutoRun();
    currentStep = 0;
    allSteps = [];
    
    document.getElementById('edgeTable').getElementsByTagName('tbody')[0].innerHTML = '';
    document.getElementById('dsuTable').getElementsByTagName('tbody')[0].innerHTML = '';
    document.getElementById('graph-container').innerHTML = '<p>Graph will be displayed here.</p>';
    
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
    
    if(resetInput) logMessage('All data cleared.', 'info');
}

/* --- UI UPDATE --- */
function updateInterface(state) {
    let logType = 'info';
    if (state.status === 'SELECTED' || state.status === 'SELECTED_NODE') logType = 'success';
    else if (state.status === 'REJECTED') logType = 'error';
    
    logMessage(state.log, logType);
    
    // Edge Table
    const tbody = document.getElementById('edgeTable').getElementsByTagName('tbody')[0];
    Array.from(tbody.rows).forEach(r => r.classList.remove('edge-examining')); 
    
    if (state.edgeInfo) {
        const row = document.getElementById(`edge-row-${state.edgeInfo.id}`);
        if (row) {
            if (state.status === 'SELECTED' || state.status === 'SELECTED_NODE') {
                row.className = 'edge-selected';
                row.cells[3].textContent = 'In MST';
            } else if (state.status === 'REJECTED') {
                row.className = 'edge-rejected';
                row.cells[3].textContent = 'Cycle';
            } else if (state.status === 'EXAMINING' || state.status === 'UPDATE_DIST') {
                row.classList.add('edge-examining');
                row.cells[3].textContent = 'Checking...';
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // Status Table (Prim or Kruskal)
    const statusBody = document.getElementById('dsuTable').getElementsByTagName('tbody')[0];
    statusBody.innerHTML = '';

    if (state.dsuSnapshot) {
        state.dsuSnapshot.forEach((p, i) => {
            if (i > 0) {
                const r = statusBody.insertRow();
                r.innerHTML = `<td>${i}</td><td>${p}</td>`;
                if(p === i) r.style.fontWeight = 'bold';
            }
        });
    } else if (state.primSnapshot) {
        const { dist, parent, visited } = state.primSnapshot;
        for(let i = 1; i < dist.length; i++) {
            const r = statusBody.insertRow();
            const dVal = dist[i] === Infinity ? 'Inf' : dist[i];
            const pVal = parent[i] === -1 ? '-' : parent[i];
            r.innerHTML = `<td>${i}</td><td>${dVal}</td><td>${pVal}</td>`;
            if (visited[i]) {
                r.style.backgroundColor = '#d5f5e3';
            }
        }
    }

    updateGraphVisualization(state);
}

function logMessage(msg, type) {
    const log = document.getElementById('messageLog');
    const color = type === 'error' ? 'red' : (type === 'success' ? 'green' : '#333');
    log.innerHTML = `<p style="color:${color}">[${new Date().toLocaleTimeString()}] ${msg}</p>` + log.innerHTML;
}

window.onload = () => { clearGraph(true); };
