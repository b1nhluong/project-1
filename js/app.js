// Globals
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

/* --- FILE INPUT LOGIC --- */
function triggerFileInput() {
    document.getElementById('fileInput').click();
}

/* --- FILE PROCESSING --- */
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

function sortEdges() {
    if (!graphData.edges.length) return;
    
    const res = setupKruskalSteps(graphData.N, graphData.edges);
    allKruskalSteps = res.steps;
    
    // Render Edge Table
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
    
    logMessage('Edges sorted. Ready to run.', 'success');
}

/* --- CONTROLS --- */
function nextStep() {
    if (currentStep >= allKruskalSteps.length) {
        logMessage('Kruskal algorithm finished.', 'info');
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

    currentStep -= 2;
    
    const state = allKruskalSteps[currentStep];
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
        if (currentStep >= allKruskalSteps.length) return;
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
    if (currentStep < allKruskalSteps.length) document.getElementById('stepButton').disabled = false;
    if (currentStep > 1) document.getElementById('prevButton').disabled = false;
}


/* --- RESET FUNCTIONS --- */

function resetSteps() {
    stopAutoRun();
    currentStep = 0;
    
    if (allKruskalSteps.length > 0) {
        const tbody = document.getElementById('edgeTable').getElementsByTagName('tbody')[0];
        Array.from(tbody.rows).forEach(r => { r.classList.remove('edge-selected', 'edge-rejected', 'edge-examining'); r.cells[3].textContent = '-'; });
        
        updateInterface(allKruskalSteps[0]);
        currentStep = 1; 

        logMessage('Progress reset.', 'info');
        
        document.getElementById('stepButton').disabled = false;
        document.getElementById('runButton').disabled = false;
        document.getElementById('prevButton').disabled = true;
    }
}

function clearGraph(resetInput = true) {
    stopAutoRun();
    currentStep = 0;
    allKruskalSteps = [];
    
    document.getElementById('edgeTable').getElementsByTagName('tbody')[0].innerHTML = '';
    document.getElementById('dsuTable').getElementsByTagName('tbody')[0].innerHTML = '';
    document.getElementById('graph-container').innerHTML = '<p>Graph will be displayed here after data import.</p>';
    
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
    // 1. Log
    logMessage(state.log, state.status === 'SELECTED' ? 'success' : (state.status === 'REJECTED' ? 'error' : 'info'));
    
    // 2. Edge Table (Highlight row)
    const tbody = document.getElementById('edgeTable').getElementsByTagName('tbody')[0];
    Array.from(tbody.rows).forEach(r => r.classList.remove('edge-examining')); 
    
    if (state.edgeInfo) {
        const row = document.getElementById(`edge-row-${state.edgeInfo.id}`);
        if (row) {
            if (state.status === 'SELECTED') {
                row.className = 'edge-selected';
                row.cells[3].textContent = 'Selected';
            } else if (state.status === 'REJECTED') {
                row.className = 'edge-rejected';
                row.cells[3].textContent = 'Rejected';
            } else if (state.status === 'EXAMINING') {
                row.classList.add('edge-examining');
                row.cells[3].textContent = 'Examining...';
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // 3. DSU Table
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

    // 4. Graph Vis
    updateGraphVisualization(state);
}

function logMessage(msg, type) {
    const log = document.getElementById('messageLog');
    const color = type === 'error' ? 'red' : (type === 'success' ? 'green' : '#333');
    log.innerHTML = `<p style="color:${color}">[${new Date().toLocaleTimeString()}] ${msg}</p>` + log.innerHTML;
}

window.onload = () => { clearGraph(true); };
