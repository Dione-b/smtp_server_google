// Variáveis globais
let token = localStorage.getItem('token');
let projectsData = [];

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está autenticado
    checkAuth();
    
    // Configurar listeners para formulários e botões
    setupEventListeners();
    
    // Configurar sistema de abas
    setupTabs();
});

// Função para verificar autenticação
function checkAuth() {
    // Se estamos na página protegida e não temos token, redirecionar para login
    if (document.body.classList.contains('protected') && !token) {
        window.location.href = '/login';
        return;
    }
    
    // Se estamos na página de login e já temos token, redirecionar para dashboard
    if (document.getElementById('login-form') && token) {
        window.location.href = '/dashboard';
        return;
    }
    
    // Se estamos na página protegida e temos token, carregar os dados
    if (document.body.classList.contains('protected') && token) {
        loadDashboardData();
    }
}

// Configurar todos os event listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Create project form
    const createProjectForm = document.getElementById('create-project-form');
    if (createProjectForm) {
        createProjectForm.addEventListener('submit', handleCreateProject);
    }
    
    // Botões de navegação de aba
    document.querySelectorAll('.nav-link[data-tab]').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Botões "Ver Todos" dentro do dashboard
    document.querySelectorAll('.btn[data-tab]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

// Configurar sistema de abas
function setupTabs() {
    // Verificar se há uma aba ativa no localStorage
    const activeTab = localStorage.getItem('activeTab') || 'dashboard';
    switchTab(activeTab);
}

// Função para alternar entre abas
function switchTab(tabId) {
    // Atualizar classes das abas na navegação
    document.querySelectorAll('.nav-link[data-tab]').forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Atualizar conteúdo visível
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === `${tabId}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // Salvar aba ativa no localStorage
    localStorage.setItem('activeTab', tabId);
    
    // Carregar dados específicos da aba, se necessário
    if (tabId === 'projects') {
        loadProjects();
    } else if (tabId === 'dashboard') {
        loadDashboardData();
    }
}

// Carregar dados do dashboard
function loadDashboardData() {
    loadProjects(true); // Carrega apenas alguns projetos recentes
    loadStats(); // Carrega estatísticas
}

// Carregar estatísticas
function loadStats() {
    // Aqui você pode fazer uma chamada API para obter estatísticas
    // Por enquanto, vamos apenas mostrar o número de projetos
    fetch('/api/projects', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Falha ao carregar estatísticas');
        }
        return response.json();
    })
    .then(data => {
        // Atualizar estatísticas no dashboard
        document.getElementById('total-projects').textContent = data.projects.length;
        
        // Aqui você pode adicionar mais estatísticas quando a API fornecer
        document.getElementById('verified-emails').textContent = '0'; // Placeholder
        document.getElementById('sent-emails').textContent = '0'; // Placeholder
    })
    .catch(error => {
        console.error('Erro ao carregar estatísticas:', error);
        showAlert('Erro ao carregar estatísticas. Por favor, tente novamente.', 'danger');
    });
}

// Função para lidar com o login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    fetch('/api/admin-login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Credenciais inválidas');
        }
        return response.json();
    })
    .then(data => {
        // Salvar token e redirecionar
        localStorage.setItem('token', data.access_token);
        window.location.href = '/dashboard';
    })
    .catch(error => {
        console.error('Erro de login:', error);
        showAlert('Email ou senha incorretos. Por favor, tente novamente.', 'danger');
    });
}

// Função para lidar com o logout
function handleLogout(e) {
    e.preventDefault();
    
    // Remover token e redirecionar
    localStorage.removeItem('token');
    localStorage.removeItem('activeTab');
    window.location.href = '/login';
}

// Função para lidar com a criação de projetos
function handleCreateProject(e) {
    e.preventDefault();
    
    const projectName = document.getElementById('project-name').value;
    const projectDescription = document.getElementById('project-description').value;
    const mailUsername = document.getElementById('mail-username').value;
    const mailPassword = document.getElementById('mail-password').value;
    
    // Criar objeto com dados do projeto
    const projectData = {
        name: projectName,
        description: projectDescription
    };
    
    // Adicionar credenciais de email apenas se ambos os campos estiverem preenchidos
    if (mailUsername && mailPassword) {
        projectData.mail_username = mailUsername;
        projectData.mail_password = mailPassword;
    }
    
    // Enviar para a API
    fetch('/api/projects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Falha ao criar projeto');
        }
        return response.json();
    })
    .then(data => {
        showAlert('Projeto criado com sucesso!', 'success');
        
        // Limpar formulário
        document.getElementById('create-project-form').reset();
        
        // Atualizar lista de projetos e mudar para a aba de projetos
        loadProjects();
        switchTab('projects');
    })
    .catch(error => {
        console.error('Erro ao criar projeto:', error);
        showAlert('Erro ao criar projeto. Por favor, tente novamente.', 'danger');
    });
}

// Função para carregar projetos
function loadProjects(onlyRecent = false) {
    fetch('/api/projects', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Falha ao carregar projetos');
        }
        return response.json();
    })
    .then(data => {
        projectsData = data.projects;
        
        if (onlyRecent) {
            // Para o dashboard, mostrar apenas os 3 projetos mais recentes
            const recentProjects = [...projectsData].slice(0, 3);
            renderProjects(recentProjects, 'recent-projects');
        } else {
            // Para a aba de projetos, mostrar todos
            renderProjects(projectsData, 'project-list');
        }
    })
    .catch(error => {
        console.error('Erro ao carregar projetos:', error);
        showAlert('Erro ao carregar projetos. Por favor, tente novamente.', 'danger');
    });
}

// Função para renderizar projetos na interface
function renderProjects(projects, containerId) {
    const container = document.getElementById(containerId);
    
    // Limpar container
    container.innerHTML = '';
    
    if (projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-folder-open"></i>
                </div>
                <h3>Nenhum projeto encontrado</h3>
                <p>Crie seu primeiro projeto para começar.</p>
                <button class="btn btn-primary mt-3" onclick="switchTab('create')">
                    <i class="fas fa-plus-circle"></i> Criar Projeto
                </button>
            </div>
        `;
        return;
    }
    
    // Renderizar cada projeto
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        
        projectCard.innerHTML = `
            <div class="project-card-header">
                <h3>${project.name}</h3>
            </div>
            <div class="project-card-body">
                <p>${project.description || 'Sem descrição'}</p>
                <p><strong>Email:</strong> ${project.mail_username || 'Não configurado'}</p>
                <div class="api-key">
                    <strong>API Key:</strong> ${project.api_key}
                    <button class="copy-btn" data-api-key="${project.api_key}" title="Copiar API Key">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="project-card-footer">
                <span class="badge badge-success">
                    <i class="fas fa-check-circle"></i> Ativo
                </span>
                <button class="btn btn-outline-primary btn-sm" onclick="viewProjectDetails(${project.id})">
                    <i class="fas fa-info-circle"></i> Detalhes
                </button>
            </div>
        `;
        
        container.appendChild(projectCard);
    });
    
    // Adicionar event listeners para os botões de cópia
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const apiKey = this.getAttribute('data-api-key');
            copyToClipboard(apiKey);
            showAlert('API Key copiada para a área de transferência!', 'success');
        });
    });
}

// Função para visualizar detalhes do projeto (a ser implementada)
function viewProjectDetails(projectId) {
    // Aqui você pode implementar uma modal ou redirecionar para uma página de detalhes
    alert(`Detalhes do projeto ${projectId} serão implementados em breve!`);
}

// Função para copiar texto para a área de transferência
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .catch(err => {
            console.error('Erro ao copiar texto:', err);
        });
}

// Função para mostrar alertas
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'danger' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}"></i>
        ${message}
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Remover alerta após 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
