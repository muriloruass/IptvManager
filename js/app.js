
let clients = []; 
let currentFilter = 'all'; 
let editingClientId = null; 

function init() {
    loadClients();
    updateStats(); 
    renderClients();
    checkExpiredTrials(); 
}


// Carrega os clientes salvos no navegador
function loadClients() {
    const saved = localStorage.getItem('iptvClients');
    if (saved) {
        clients = JSON.parse(saved);
    }
}

// Salva os clientes no navegador
function saveToLocalStorage() {
    localStorage.setItem('iptvClients', JSON.stringify(clients));
}


// Aq Verifica automaticamente se os testes de 6 horas venceram
function checkExpiredTrials() {
    let updated = false;
    const now = new Date();

    clients.forEach(client => {
        // Se o cliente está em teste
        if (client.status === 'trial') {
            const createdDate = new Date(client.createdAt);
            const diff = now - createdDate; // Diferença em milissegundos
            const hours = diff / (1000 * 60 * 60); // Converte para horas

            // Se passaram mais de 6 horas, marca como vencido
            if (hours >= 6) {
                client.status = 'expired';
                updated = true;
            }
        }
    });

    // Se algum cliente foi atualizado, salva e recarrega a página
    if (updated) {
        saveToLocalStorage();
        updateStats();
        renderClients();
    }
}
//dashboard

// Atualiza os números nas estatísticas
function updateStats() {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'active').length;
    const trial = clients.filter(c => c.status === 'trial').length;
    const expired = clients.filter(c => c.status === 'expired').length;

    // Atualiza os elementos HTML
    document.getElementById('totalClients').textContent = total;
    document.getElementById('activeClients').textContent = active;
    document.getElementById('trialClients').textContent = trial;
    document.getElementById('expiredClients').textContent = expired;
}

// Exibe os clientes na tela
function renderClients() {
    const container = document.getElementById('clientsList');
    
    // Ordena os clientes por nome
    let filteredClients = [...clients].sort((a, b) => 
        a.name.localeCompare(b.name)
    );

    // Se não houver clientes, mostra mensagem
    if (filteredClients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Nenhum cliente cadastrado</h3>
                <p>Clique em "Adicionar Cliente" para começar</p>
            </div>
        `;
        return;
    }

    // Cria o HTML para cada cliente
    container.innerHTML = filteredClients.map(client => {
        // Define o texto do status em português
        const statusText = {
            'active': 'Ativo',
            'trial': 'Em Teste',
            'expired': 'Vencido'
        };

        // Calcula o tempo restante para testes
        let timeInfo = '';
        if (client.status === 'trial') {
            const now = new Date();
            const created = new Date(client.createdAt);
            const elapsed = (now - created) / (1000 * 60 * 60); // Horas decorridas
            const remaining = Math.max(0, 6 - elapsed);
            timeInfo = `<div class="info-item">
                <strong>Tempo Restante</strong>
                ${remaining.toFixed(1)} horas
            </div>`;
        }

        // Formata a data de vencimento
        let expiryInfo = '';
        if (client.expiryDate) {
            const expiry = new Date(client.expiryDate);
            const formattedDate = expiry.toLocaleDateString('pt-BR');
            expiryInfo = `<div class="info-item">
                <strong>Vencimento</strong>
                ${formattedDate}
            </div>`;
        }

        return `
            <div class="client-card status-${client.status}">
                <div class="client-header">
                    <div class="client-name">${client.name}</div>
                    <div class="client-status ${client.status}">${statusText[client.status]}</div>
                </div>
                <div class="client-info">
                    <div class="info-item">
                        <strong>📧 Email</strong>
                        ${client.email}
                    </div>
                    <div class="info-item">
                        <strong>📱 Telefone</strong>
                        ${client.phone}
                    </div>
                    <div class="info-item">
                        <strong>📦 Plano</strong>
                        ${client.plan}
                    </div>
                    ${timeInfo}
                    ${expiryInfo}
                </div>
                <div class="client-actions">
                    <button class="btn btn-edit" onclick="editClient('${client.id}')">✏️ Editar</button>
                    <button class="btn btn-delete" onclick="deleteClient('${client.id}')">🗑️ Excluir</button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== MODAL (JANELA DE FORMULÁRIO) =====

// Abre o modal para adicionar novo cliente
function openModal() {
    editingClientId = null;
    document.getElementById('modalTitle').textContent = '➕ Adicionar Novo Cliente';
    document.getElementById('clientForm').reset();
    document.getElementById('expiryDateGroup').style.display = 'none';
    document.getElementById('clientModal').classList.add('active');
}

// Fecha o modal
function closeModal() {
    document.getElementById('clientModal').classList.remove('active');
    editingClientId = null;
}

// Mostra/esconde o campo de data de vencimento
function toggleExpiryDate() {
    const status = document.getElementById('clientStatus').value;
    const expiryGroup = document.getElementById('expiryDateGroup');
    
    if (status === 'active') {
        expiryGroup.style.display = 'block';
        document.getElementById('clientExpiry').required = true;
    } else {
        expiryGroup.style.display = 'none';
        document.getElementById('clientExpiry').required = false;
    }
}

// ===== SALVAR CLIENTE (ADICIONAR OU EDITAR) =====

function saveClient(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    // Coleta os dados do formulário
    const name = document.getElementById('clientName').value;
    const email = document.getElementById('clientEmail').value;
    const phone = document.getElementById('clientPhone').value;
    const plan = document.getElementById('clientPlan').value;
    const status = document.getElementById('clientStatus').value;
    const expiryDate = document.getElementById('clientExpiry').value;

    // Se estamos editando um cliente existente
    if (editingClientId) {
        const index = clients.findIndex(c => c.id === editingClientId);
        if (index !== -1) {
            clients[index] = {
                ...clients[index],
                name,
                email,
                phone,
                plan,
                status,
                expiryDate: status === 'active' ? expiryDate : null
            };
        }
    } else {
        // Criando novo cliente
        const newClient = {
            id: Date.now().toString(), // ID único baseado no timestamp
            name,
            email,
            phone,
            plan,
            status,
            expiryDate: status === 'active' ? expiryDate : null,
            createdAt: new Date().toISOString() // Data de criação
        };
        clients.push(newClient);
    }

    // Salva, atualiza e fecha o modal
    saveToLocalStorage();
    updateStats();
    renderClients();
    closeModal();
}

// ===== EDITAR CLIENTE =====

function editClient(id) {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    editingClientId = id;
    document.getElementById('modalTitle').textContent = '✏️ Editar Cliente';
    
    // Preenche o formulário com os dados do cliente
    document.getElementById('clientName').value = client.name;
    document.getElementById('clientEmail').value = client.email;
    document.getElementById('clientPhone').value = client.phone;
    document.getElementById('clientPlan').value = client.plan;
    document.getElementById('clientStatus').value = client.status;
    
    // Se for cliente ativo, mostra e preenche a data
    if (client.status === 'active' && client.expiryDate) {
        document.getElementById('expiryDateGroup').style.display = 'block';
        document.getElementById('clientExpiry').value = client.expiryDate;
        document.getElementById('clientExpiry').required = true;
    }

    document.getElementById('clientModal').classList.add('active');
}

// ===== EXCLUIR CLIENTE =====

function deleteClient(id) {
    // Confirma antes de excluir
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        clients = clients.filter(c => c.id !== id);
        saveToLocalStorage();
        updateStats();
        renderClients();
    }
}

// ===== FILTROS =====

function filterClients(filter) {
    currentFilter = filter;

    // Atualiza os botões de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    // Filtra os clientes
    let filtered = clients;
    if (filter !== 'all') {
        filtered = clients.filter(c => c.status === filter);
    }

    // Atualiza a lista
    const container = document.getElementById('clientsList');
    if (filtered.length === 0) {
        const filterNames = {
            'all': 'cadastrados',
            'active': 'ativos',
            'trial': 'em teste',
            'expired': 'vencidos'
        };
        container.innerHTML = `
            <div class="empty-state">
                <h3>Nenhum cliente ${filterNames[filter]}</h3>
            </div>
        `;
    } else {
        clients = filtered;
        renderClients();
        loadClients(); // Recarrega todos os clientes
    }
}

// ===== BUSCA =====

function searchClients() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // Filtra por nome
    const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm)
    );

    // Renderiza os resultados
    const container = document.getElementById('clientsList');
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Nenhum cliente encontrado</h3>
                <p>Tente buscar por outro nome</p>
            </div>
        `;
    } else {
        const temp = clients;
        clients = filtered;
        renderClients();
        clients = temp;
    }
}

// ===== VERIFICAÇÃO PERIÓDICA =====

// Verifica testes vencidos a cada minuto
setInterval(checkExpiredTrials, 60000);

// ===== INICIALIZA O APP =====
init();

// Fecha o modal ao clicar fora dele
document.getElementById('clientModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});
