document.addEventListener('DOMContentLoaded', () => {
    // Current date in header
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-BR', options);

    // Dashboard State
    let allTickets = [];
    let filteredTickets = [];
    let stats = {};
    
    // Pagination
    let currentPage = 1;
    const pageSize = 10;

    // Chart instances
    let charts = {
        objeto: null,
        timeline: null,
        solucionador: null,
        status: null
    };

    // UI Elements
    const searchInput = document.getElementById('search-input');
    const filterPeriodo = document.getElementById('filter-periodo');
    const filterDateStart = document.getElementById('filter-date-start');
    const filterDateEnd = document.getElementById('filter-date-end');
    const presetPills = document.querySelectorAll('.preset-pill');
    const periodSummaryText = document.getElementById('period-summary-text');
    const filterObjeto = document.getElementById('filter-objeto');
    const filterSolucionador = document.getElementById('filter-solucionador');
    const filterStatus = document.getElementById('filter-status');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const chartTimelineTitle = document.getElementById('chart-timeline-title');
    const tableBody = document.getElementById('tickets-table-body');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageNumbersContainer = document.getElementById('page-numbers');
    const paginationInfo = document.getElementById('pagination-info');

    // Modal Drawer Elements
    const ticketModal = document.getElementById('ticket-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalTicketId = document.getElementById('modal-ticket-id');
    const modalStatus = document.getElementById('modal-status');
    const modalObjeto = document.getElementById('modal-objeto');
    const modalSolicitante = document.getElementById('modal-solicitante');
    const modalSolucionador = document.getElementById('modal-solucionador');
    const modalContato = document.getElementById('modal-contato');
    const modalDatas = document.getElementById('modal-datas');
    const modalTempo = document.getElementById('modal-tempo');
    const modalDesc = document.getElementById('modal-desc');

    // Chart styling helper
    const chartColors = {
        blue: '#3b82f6',
        teal: '#14b8a6',
        purple: '#8b5cf6',
        pink: '#ec4899',
        red: '#ef4444',
        green: '#10b981',
        orange: '#f97316',
        yellow: '#eab308',
        slate: '#64748b'
    };

    const colorPalette = [
        chartColors.blue,
        chartColors.teal,
        chartColors.purple,
        chartColors.pink,
        chartColors.green,
        chartColors.orange,
        chartColors.yellow,
        chartColors.red
    ];

    // Date & Period Helpers
    function getReferenceDate() {
        let maxTicketTime = 0;
        allTickets.forEach(t => {
            if (t.dt_ab) {
                const time = new Date(t.dt_ab + 'T12:00:00').getTime();
                if (time > maxTicketTime) maxTicketTime = time;
            }
        });
        const now = new Date();
        // If dataset has tickets and today is more than 30 days after latest ticket,
        // use latest ticket date as reference so relative presets like 30/90 days show data!
        if (maxTicketTime > 0 && (now.getTime() - maxTicketTime > 30 * 24 * 60 * 60 * 1000)) {
            return new Date(maxTicketTime);
        }
        return now;
    }

    function formatDateToInput(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDateBr(isoStr) {
        if (!isoStr) return '';
        const [y, m, d] = isoStr.split('-');
        return `${d}/${m}/${y}`;
    }

    function updatePeriodSummary() {
        if (!periodSummaryText) return;
        const total = filteredTickets.length;
        const countStr = `${total} chamado${total !== 1 ? 's' : ''}`;
        const startVal = filterDateStart ? filterDateStart.value : '';
        const endVal = filterDateEnd ? filterDateEnd.value : '';

        if (!startVal && !endVal) {
            periodSummaryText.textContent = `Todo o período (${countStr})`;
        } else if (startVal && endVal) {
            periodSummaryText.textContent = `Período: ${formatDateBr(startVal)} a ${formatDateBr(endVal)} (${countStr})`;
        } else if (startVal) {
            periodSummaryText.textContent = `A partir de ${formatDateBr(startVal)} (${countStr})`;
        } else if (endVal) {
            periodSummaryText.textContent = `Até ${formatDateBr(endVal)} (${countStr})`;
        }
    }

    function updatePresetPillsActive(activeKey) {
        presetPills.forEach(pill => {
            if (pill.dataset.period === activeKey) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });
    }

    function setPeriodPreset(presetKey) {
        const ref = getReferenceDate();
        let startDate = '';
        let endDate = '';

        if (presetKey === 'all') {
            startDate = '';
            endDate = '';
        } else if (presetKey === '30days') {
            const start = new Date(ref);
            start.setDate(start.getDate() - 29);
            startDate = formatDateToInput(start);
            endDate = formatDateToInput(ref);
        } else if (presetKey === '90days') {
            const start = new Date(ref);
            start.setDate(start.getDate() - 89);
            startDate = formatDateToInput(start);
            endDate = formatDateToInput(ref);
        } else if (presetKey === '180days') {
            const start = new Date(ref);
            start.setDate(start.getDate() - 179);
            startDate = formatDateToInput(start);
            endDate = formatDateToInput(ref);
        } else if (/^\d{4}$/.test(presetKey)) {
            startDate = `${presetKey}-01-01`;
            endDate = `${presetKey}-12-31`;
        }

        if (presetKey !== 'custom') {
            if (filterDateStart) filterDateStart.value = startDate;
            if (filterDateEnd) filterDateEnd.value = endDate;
            if (filterPeriodo) filterPeriodo.value = presetKey;
        }

        updatePresetPillsActive(presetKey);
        applyFilters();
    }

    // Load Data
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allTickets = data.tickets;
            stats = data.stats;
            filteredTickets = [...allTickets];
            
            initializeFilters();
            updatePeriodSummary();
            updateDashboard();
        })
        .catch(err => {
            console.error('Erro ao carregar dados do dashboard:', err);
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-red);">Erro ao carregar os dados. Certifique-se de que o servidor local está rodando e o arquivo data.json existe.</td></tr>`;
        });

    // Populate Filters dropdowns
    function initializeFilters() {
        // Objeto
        const objetos = [...new Set(allTickets.map(t => t.objeto))].sort();
        objetos.forEach(obj => {
            if(obj) {
                const opt = document.createElement('option');
                opt.value = obj;
                opt.textContent = obj;
                filterObjeto.appendChild(opt);
            }
        });

        // Solucionador
        const solucionadores = [...new Set(allTickets.map(t => t.solucionador))].sort();
        solucionadores.forEach(sol => {
            if(sol) {
                const opt = document.createElement('option');
                opt.value = sol;
                opt.textContent = sol;
                filterSolucionador.appendChild(opt);
            }
        });

        // Status
        const statuses = [...new Set(allTickets.map(t => t.status))].sort();
        statuses.forEach(status => {
            if(status) {
                const opt = document.createElement('option');
                opt.value = status;
                opt.textContent = status;
                filterStatus.appendChild(opt);
            }
        });

        // Setup min and max on date inputs
        const dates = allTickets.map(t => t.dt_ab).filter(Boolean).sort();
        if (dates.length > 0) {
            if (filterDateStart) {
                filterDateStart.min = dates[0];
                filterDateStart.max = dates[dates.length - 1];
            }
            if (filterDateEnd) {
                filterDateEnd.min = dates[0];
                filterDateEnd.max = dates[dates.length - 1];
            }
        }
    }

    // Filter Logic
    function applyFilters() {
        const query = searchInput.value.toLowerCase().trim();
        const objVal = filterObjeto.value;
        const solVal = filterSolucionador.value;
        const statusVal = filterStatus.value;
        const dateStartVal = filterDateStart ? filterDateStart.value : '';
        const dateEndVal = filterDateEnd ? filterDateEnd.value : '';

        filteredTickets = allTickets.filter(t => {
            const matchesSearch = !query || 
                (t.nr && String(t.nr).includes(query)) ||
                (t.solicitante && t.solicitante.toLowerCase().includes(query)) ||
                (t.email && t.email.toLowerCase().includes(query)) ||
                (t.desc && t.desc.toLowerCase().includes(query)) ||
                (t.objeto && t.objeto.toLowerCase().includes(query));
                
            const matchesObjeto = !objVal || t.objeto === objVal;
            const matchesSolucionador = !solVal || t.solucionador === solVal;
            const matchesStatus = !statusVal || t.status === statusVal;

            // Date Range Filter on ticket opening date (dt_ab)
            const ticketDate = t.dt_ab;
            const matchesDateStart = !dateStartVal || (ticketDate && ticketDate >= dateStartVal);
            const matchesDateEnd = !dateEndVal || (ticketDate && ticketDate <= dateEndVal);

            return matchesSearch && matchesObjeto && matchesSolucionador && matchesStatus && matchesDateStart && matchesDateEnd;
        });

        currentPage = 1;
        updateDashboard();
        updatePeriodSummary();
    }

    // Event Listeners for Filters
    searchInput.addEventListener('input', applyFilters);
    filterObjeto.addEventListener('change', applyFilters);
    filterSolucionador.addEventListener('change', applyFilters);
    filterStatus.addEventListener('change', applyFilters);

    // Period Preset Dropdown Event
    if (filterPeriodo) {
        filterPeriodo.addEventListener('change', () => {
            setPeriodPreset(filterPeriodo.value);
        });
    }

    // Manual Date Picker Inputs
    const handleManualDateChange = () => {
        if (filterPeriodo) filterPeriodo.value = 'custom';
        updatePresetPillsActive('custom');
        applyFilters();
    };

    if (filterDateStart) filterDateStart.addEventListener('change', handleManualDateChange);
    if (filterDateEnd) filterDateEnd.addEventListener('change', handleManualDateChange);

    // Preset Pill Buttons
    presetPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const period = pill.dataset.period;
            setPeriodPreset(period);
        });
    });

    // Clear Filters
    clearFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterObjeto.value = '';
        filterSolucionador.value = '';
        filterStatus.value = '';
        if (filterDateStart) filterDateStart.value = '';
        if (filterDateEnd) filterDateEnd.value = '';
        if (filterPeriodo) filterPeriodo.value = 'all';
        updatePresetPillsActive('all');
        filteredTickets = [...allTickets];
        currentPage = 1;
        updateDashboard();
        updatePeriodSummary();
    });

    // Update Dashboard Elements
    function updateDashboard() {
        updateKPIs();
        updateCharts();
        updateTable();
    }

    // KPIs Calculation
    function updateKPIs() {
        const total = filteredTickets.length;
        const resolved = filteredTickets.filter(t => t.status === 'RESOLVIDO').length;
        const pending = total - resolved;
        
        // Average resolution time for current selection
        const resolvedWithTime = filteredTickets.filter(t => t.tempo_resolucao_dias !== null);
        const avgTime = resolvedWithTime.length > 0
            ? (resolvedWithTime.reduce((sum, t) => sum + t.tempo_resolucao_dias, 0) / resolvedWithTime.length).toFixed(1)
            : 0;

        document.getElementById('kpi-total-tickets').textContent = total;
        document.getElementById('kpi-resolved-tickets').textContent = resolved;
        document.getElementById('kpi-avg-time').textContent = `${avgTime} dias`;
        document.getElementById('kpi-pending-tickets').textContent = pending;
    }

    // Chartjs Render/Update
    function updateCharts() {
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 15,
                    right: 15,
                    top: 15,
                    bottom: 5
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 11 } }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
            }
        };

        // 1. Objeto Distribution Chart (Horizontal Bar)
        const objetoCounts = {};
        filteredTickets.forEach(t => {
            const obj = t.objeto || 'Não Informado';
            objetoCounts[obj] = (objetoCounts[obj] || 0) + 1;
        });
        const objetoSorted = Object.entries(objetoCounts).sort((a,b) => b[1] - a[1]).slice(0, 10);
        
        if (charts.objeto) charts.objeto.destroy();
        const ctxObjeto = document.getElementById('chart-objeto').getContext('2d');
        charts.objeto = new Chart(ctxObjeto, {
            type: 'bar',
            data: {
                labels: objetoSorted.map(x => x[0].replace('[DTCEA-SJ]', '')),
                datasets: [{
                    label: 'Quantidade',
                    data: objetoSorted.map(x => x[1]),
                    backgroundColor: colorPalette,
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                ...chartOptions,
                indexAxis: 'y',
                plugins: {
                    ...chartOptions.plugins,
                    legend: { display: false }
                }
            }
        });

        // 2. Timeline Chart (Line)
        const timelineCounts = {};
        const dates = filteredTickets.map(t => t.dt_ab).filter(Boolean).sort();
        
        let isShortSpan = false;
        if (dates.length > 0) {
            const minD = new Date(dates[0] + 'T00:00:00');
            const maxD = new Date(dates[dates.length - 1] + 'T00:00:00');
            const diffDays = Math.round((maxD - minD) / (1000 * 60 * 60 * 24));
            if (diffDays <= 60) {
                isShortSpan = true;
            }
        }

        if (chartTimelineTitle) {
            chartTimelineTitle.textContent = isShortSpan
                ? 'Chamados por Dia no Período'
                : 'Chamados Criados ao Longo do Tempo';
        }

        filteredTickets.forEach(t => {
            if (t.dt_ab) {
                const key = isShortSpan ? t.dt_ab : t.dt_ab.slice(0, 7);
                timelineCounts[key] = (timelineCounts[key] || 0) + 1;
            }
        });
        const timelineSorted = Object.entries(timelineCounts).sort((a,b) => a[0].localeCompare(b[0]));
        
        // Format labels from YYYY-MM to MM/YYYY or YYYY-MM-DD to DD/MM
        const timelineLabels = timelineSorted.map(x => {
            if (isShortSpan) {
                const [y, m, d] = x[0].split('-');
                return `${d}/${m}`;
            } else {
                const [y, m] = x[0].split('-');
                return `${m}/${y}`;
            }
        });

        if (charts.timeline) charts.timeline.destroy();
        const ctxTimeline = document.getElementById('chart-timeline').getContext('2d');
        charts.timeline = new Chart(ctxTimeline, {
            type: 'line',
            data: {
                labels: timelineLabels,
                datasets: [{
                    label: isShortSpan ? 'Chamados no Dia' : 'Chamados no Mês',
                    data: timelineSorted.map(x => x[1]),
                    borderColor: chartColors.blue,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: chartColors.blue
                }]
            },
            options: chartOptions
        });

        // 3. Solucionador Chart (Bar)
        const solverCounts = {};
        filteredTickets.forEach(t => {
            const sol = t.solucionador || 'Não Designado';
            solverCounts[sol] = (solverCounts[sol] || 0) + 1;
        });
        const solverSorted = Object.entries(solverCounts).sort((a,b) => b[1] - a[1]).slice(0, 7);

        if (charts.solucionador) charts.solucionador.destroy();
        const ctxSolver = document.getElementById('chart-solucionador').getContext('2d');
        charts.solucionador = new Chart(ctxSolver, {
            type: 'bar',
            data: {
                labels: solverSorted.map(x => x[0]),
                datasets: [{
                    label: 'Quantidade',
                    data: solverSorted.map(x => x[1]),
                    backgroundColor: chartColors.purple,
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    legend: { display: false }
                }
            }
        });

        // 4. Status Distribution (Doughnut)
        const statusCounts = {};
        filteredTickets.forEach(t => {
            const st = t.status || 'OUTROS';
            statusCounts[st] = (statusCounts[st] || 0) + 1;
        });

        const statusLabels = Object.keys(statusCounts);
        const statusColors = statusLabels.map(label => {
            if (label === 'RESOLVIDO') return chartColors.green;
            if (label === 'ABERTO') return chartColors.red;
            return chartColors.orange;
        });

        if (charts.status) charts.status.destroy();
        const ctxStatus = document.getElementById('chart-status').getContext('2d');
        charts.status = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: statusColors,
                    borderWidth: 0
                }]
            },
            options: {
                ...chartOptions,
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }

    // Table Pagination & Render
    function updateTable() {
        const total = filteredTickets.length;
        const totalPages = Math.ceil(total / pageSize);
        
        // Boundary check
        if (currentPage > totalPages) currentPage = totalPages || 1;
        
        const startIdx = (currentPage - 1) * pageSize;
        const endIdx = Math.min(startIdx + pageSize, total);
        
        // Update pagination UI text
        paginationInfo.textContent = total > 0 
            ? `Mostrando ${startIdx + 1}-${endIdx} de ${total} chamados`
            : `Mostrando 0-0 de 0 chamados`;

        // Render Table Body
        tableBody.innerHTML = '';
        if (total === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Nenhum chamado encontrado para os filtros selecionados.</td></tr>`;
        } else {
            const pageData = filteredTickets.slice(startIdx, endIdx);
            pageData.forEach(t => {
                const tr = document.createElement('tr');
                
                // Format date for view
                let formatAb = '-';
                if(t.dt_ab) {
                    const [y, m, d] = t.dt_ab.split('-');
                    formatAb = `${d}/${m}/${y}`;
                }

                // Format status badge
                let badgeClass = 'status-outros';
                if (t.status === 'RESOLVIDO') badgeClass = 'status-resolvido';
                else if (t.status === 'ABERTO') badgeClass = 'status-aberto';

                const daysStr = t.tempo_resolucao_dias !== null ? `${t.tempo_resolucao_dias}d` : '-';

                tr.innerHTML = `
                    <td><strong>${t.nr || '-'}</strong></td>
                    <td>${formatAb}</td>
                    <td>${(t.objeto || '-').replace('[DTCEA-SJ]', '')}</td>
                    <td>${t.solicitante || '-'}</td>
                    <td>${t.solucionador || '-'}</td>
                    <td><span class="badge ${badgeClass}">${t.status || 'OUTROS'}</span></td>
                    <td>${daysStr}</td>
                `;

                // Modal Event Click
                tr.addEventListener('click', () => showTicketDetails(t));
                tableBody.appendChild(tr);
            });
        }

        // Render Page Numbers
        pageNumbersContainer.innerHTML = '';
        
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.style.background = i === currentPage ? 'var(--accent-blue)' : '';
            btn.style.borderColor = i === currentPage ? 'var(--accent-blue)' : '';
            btn.addEventListener('click', () => {
                currentPage = i;
                updateTable();
            });
            pageNumbersContainer.appendChild(btn);
        }

        // Enable/Disable buttons
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    // Pagination Click Events
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredTickets.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            updateTable();
        }
    });

    // Drawer Details Modal Show
    function showTicketDetails(ticket) {
        modalTicketId.textContent = `Chamado #${ticket.nr || '-----'}`;
        
        // Status
        let badgeClass = 'status-outros';
        if (ticket.status === 'RESOLVIDO') badgeClass = 'status-resolvido';
        else if (ticket.status === 'ABERTO') badgeClass = 'status-aberto';
        modalStatus.className = `badge ${badgeClass}`;
        modalStatus.textContent = ticket.status || 'OUTROS';

        modalObjeto.textContent = ticket.objeto || '-';
        modalSolicitante.textContent = ticket.solicitante || '-';
        modalSolucionador.textContent = ticket.solucionador || '-';
        
        // Contact details
        let contactStr = '';
        if (ticket.email) contactStr += `<i class="fa-regular fa-envelope"></i> ${ticket.email}`;
        if (ticket.celular) {
            if (contactStr) contactStr += ' &nbsp;|&nbsp; ';
            contactStr += `<i class="fa-solid fa-phone"></i> ${ticket.celular}`;
        }
        modalContato.innerHTML = contactStr || 'Não informado';

        // Dates
        let formatAb = '-';
        if (ticket.dt_ab) {
            const [y, m, d] = ticket.dt_ab.split('-');
            formatAb = `${d}/${m}/${y}`;
        }
        let formatMod = '-';
        if (ticket.dt_mod) {
            const [y, m, d] = ticket.dt_mod.split('-');
            formatMod = `${d}/${m}/${y}`;
        }
        modalDatas.textContent = `Aberto em: ${formatAb} | Última mod: ${formatMod}`;

        // Tempo
        modalTempo.textContent = ticket.tempo_resolucao_dias !== null 
            ? `${ticket.tempo_resolucao_dias} dias para resolução` 
            : 'Tempo de solução indisponível';

        // Descrição
        modalDesc.textContent = ticket.desc || 'Nenhuma descrição detalhada disponível.';

        ticketModal.classList.add('active');
    }

    // Modal Close
    closeModalBtn.addEventListener('click', () => {
        ticketModal.classList.remove('active');
    });

    ticketModal.addEventListener('click', (e) => {
        if (e.target === ticketModal) {
            ticketModal.classList.remove('active');
        }
    });
});
