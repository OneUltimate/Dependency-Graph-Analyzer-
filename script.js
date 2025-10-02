const translations = {
    en: {
        title: "Dependency Graph Analyzer",
        subtitle: "Visualize and analyze the dependency graph of any GitHub repository. Understand the structure and relationships between packages in your project.",
        urlPlaceholder: "Enter GitHub repository URL (e.g., https://github.com/user/repo)",
        analyzeBtn: "Analyze Dependencies",
        analyzingText: "Analyzing repository dependencies...",
        errorMessage: "Please enter a valid GitHub repository URL.",
        successMessage: "Repository analyzed successfully!",
        projectDescription: "Project Description",
        dependencyGraph: "Dependency Graph",
        totalDeps: "Total Dependencies",
        directDeps: "Direct Dependencies",
        transitiveDeps: "Transitive Dependencies",
        vulnerabilities: "Vulnerabilities",
        dependencyDetails: "Dependency Details"
    },
    ru: {
        title: "Анализатор Графа Зависимостей",
        subtitle: "Визуализируйте и анализируйте граф зависимостей любого GitHub репозитория. Поймите структуру и взаимосвязи между пакетами в вашем проекте.",
        urlPlaceholder: "Введите URL репозитория GitHub (например, https://github.com/user/repo)",
        analyzeBtn: "Анализировать Зависимости",
        analyzingText: "Анализ зависимостей репозитория...",
        errorMessage: "Пожалуйста, введите корректный URL репозитория GitHub.",
        successMessage: "Репозиторий успешно проанализирован!",
        projectDescription: "Описание Проекта",
        dependencyGraph: "Граф Зависимостей",
        totalDeps: "Всего Зависимостей",
        directDeps: "Прямые Зависимости",
        transitiveDeps: "Транзитивные Зависимости",
        vulnerabilities: "Уязвимости",
        dependencyDetails: "Детали Зависимостей"
    },
    es: {
        title: "Analizador de Gráfico de Dependencias",
        subtitle: "Visualiza y analiza el gráfico de dependencias de cualquier repositorio de GitHub. Comprende la estructura y relaciones entre paquetes en tu proyecto.",
        urlPlaceholder: "Ingresa la URL del repositorio GitHub (ej: https://github.com/user/repo)",
        analyzeBtn: "Analizar Dependencias",
        analyzingText: "Analizando dependencias del repositorio...",
        errorMessage: "Por favor ingresa una URL válida de repositorio GitHub.",
        successMessage: "¡Repositorio analizado exitosamente!",
        projectDescription: "Descripción del Proyecto",
        dependencyGraph: "Gráfico de Dependencias",
        totalDeps: "Dependencias Totales",
        directDeps: "Dependencias Directas",
        transitiveDeps: "Dependencias Transitivas",
        vulnerabilities: "Vulnerabilidades",
        dependencyDetails: "Detalles de Dependencias"
    },
    fr: {
        title: "Analyseur de Graphe de Dépendances",
        subtitle: "Visualisez et analysez le graphe de dépendances de n'importe quel dépôt GitHub. Comprenez la structure et les relations entre les packages de votre projet.",
        urlPlaceholder: "Entrez l'URL du dépôt GitHub (ex: https://github.com/user/repo)",
        analyzeBtn: "Analyser les Dépendances",
        analyzingText: "Analyse des dépendances du dépôt...",
        errorMessage: "Veuillez entrer une URL de dépôt GitHub valide.",
        successMessage: "Dépôt analysé avec succès !",
        projectDescription: "Description du Projet",
        dependencyGraph: "Graphe de Dépendances",
        totalDeps: "Dépendances Totales",
        directDeps: "Dépendances Directes",
        transitiveDeps: "Dépendances Transitives",
        vulnerabilities: "Vulnérabilités",
        dependencyDetails: "Détails des Dépendances"
    },
    de: {
        title: "Abhängigkeitsgraph-Analysator",
        subtitle: "Visualisieren und analysieren Sie den Abhängigkeitsgraphen jedes GitHub-Repositorys. Verstehen Sie die Struktur und Beziehungen zwischen Paketen in Ihrem Projekt.",
        urlPlaceholder: "GitHub-Repository-URL eingeben (z.B. https://github.com/user/repo)",
        analyzeBtn: "Abhängigkeiten Analysieren",
        analyzingText: "Analysiere Repository-Abhängigkeiten...",
        errorMessage: "Bitte geben Sie eine gültige GitHub-Repository-URL ein.",
        successMessage: "Repository erfolgreich analysiert!",
        projectDescription: "Projektbeschreibung",
        dependencyGraph: "Abhängigkeitsgraph",
        totalDeps: "Abhängigkeiten Gesamt",
        directDeps: "Direkte Abhängigkeiten",
        transitiveDeps: "Transitive Abhängigkeiten",
        vulnerabilities: "Sicherheitslücken",
        dependencyDetails: "Abhängigkeitsdetails"
    }
};

let currentLanguage = 'en';

document.addEventListener('DOMContentLoaded', function() {
   
    const analyzeBtn = document.querySelector('.modern-btn');
    const urlInput = document.querySelector('.modern-input');
    const loading = document.querySelector('.modern-loading');
    const error = document.querySelector('.modern-error');
    const success = document.querySelector('.modern-success');
    const resultsSection = document.querySelector('.results-section');
    const errorMessage = document.querySelector('.error-message');
    const successMessage = document.querySelector('.success-message');
    const readmeSection = document.getElementById('readme-section');
    const readmeContent = document.getElementById('readme-content');
    
    const languageBtn = document.getElementById('languageBtn');
    const languageDropdown = document.getElementById('languageDropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    
    const API_BASE_URL = 'http://127.0.0.1:5000';
    
    console.log('Elements loaded:', {
        analyzeBtn: !!analyzeBtn,
        urlInput: !!urlInput,
        loading: !!loading,
        error: !!error,
        success: !!success
    });
    
   
    languageBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        languageDropdown.classList.toggle('show');
    });

    languageOptions.forEach(option => {
        option.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            changeLanguage(lang);
            languageDropdown.classList.remove('show');
        });
    });

    document.addEventListener('click', function() {
        languageDropdown.classList.remove('show');
    });

    function changeLanguage(lang) {
        currentLanguage = lang;
        const translation = translations[lang];
        
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translation[key]) {
                element.textContent = translation[key];
            }
        });
        
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (translation[key]) {
                element.setAttribute('placeholder', translation[key]);
            }
        });
        
        document.querySelector('.language-text').textContent = lang.toUpperCase();
    }

    
    analyzeBtn.addEventListener('click', function() {
        console.log('Analyze button clicked');
        const url = urlInput.value.trim();
        
        if (!url || !url.includes('github.com')) {
            showError(translations[currentLanguage].errorMessage);
            return;
        }
        
        const repoInfo = extractRepoInfo(url);
        if (!repoInfo) {
            showError(translations[currentLanguage].errorMessage);
            return;
        }
        
        hideError();
        hideSuccess();
        loading.style.display = 'block';
        analyzeBtn.disabled = true;
        
       
        analyzeBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Analyzing...';
        
        analyzeDependencies(repoInfo.owner, repoInfo.repo);
    });
    
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            analyzeBtn.click();
        }
    });
    
    function extractRepoInfo(url) {
        try {
            const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (match && match.length >= 3) {
                return {
                    owner: match[1],
                    repo: match[2].replace(/\.git$/, '')
                };
            }
            return null;
        } catch (error) {
            return null;
        }
    }
    
    async function analyzeDependencies(owner, repo) {
        try {
            console.log('Analyzing dependencies for:', owner, repo);
            const response = await fetch(`${API_BASE_URL}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    owner: owner,
                    repo: repo,
                    github_url: `${urlInput.value.trim()}`
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Analysis result:', data);
            
            displayResults(data);
            
            showSuccess(translations[currentLanguage].successMessage);
            
        } catch (error) {
            console.error('Error analyzing dependencies:', error);
            showError(error.message || 'Failed to analyze repository. Please try again.');
        } finally {
            loading.style.display = 'none';
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-play"></i> ' + translations[currentLanguage].analyzeBtn;
        }
    }
    
    function displayResults(data) {
       
        animateCounter('total-deps', data.stats?.totalDependencies || 0);
        animateCounter('direct-deps', data.stats?.directDependencies || 0);
        animateCounter('transitive-deps', data.stats?.transitiveDependencies || 0);
        animateCounter('vulnerabilities', data.stats?.vulnerabilities || 0);
        
        
        if (data.readme_preview && data.readme_preview !== '--------------------') {
            readmeContent.textContent = data.readme_preview;
            readmeSection.style.display = 'block';
        } else {
            readmeSection.style.display = 'none';
        }
        
   
        renderGraph(data.graph_image);
        
        
        renderNodes(data.dependencies);
        
        resultsSection.style.display = 'block';
        
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        document.getElementById('projectInfo').style.display = 'block';
        
        document.getElementById('projectDescription').textContent = data.project_description;
    
    }
    
    function animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        let current = 0;
        const increment = targetValue / 30;
        const timer = setInterval(() => {
            current += increment;
            if (current >= targetValue) {
                element.textContent = targetValue;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 30);
    }
    
    function renderGraph(graphImage) {
        const container = document.getElementById('graph-image-container');
        
        if (graphImage) {
            container.innerHTML = `
                <img src="data:image/png;base64,${graphImage}" alt="Dependency Graph" 
                     style="max-width: 100%; border-radius: 12px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-top: 1.5rem;">
                    <button class="modern-btn" style="padding: 0.8rem 1.5rem; margin: 0 0.5rem;">
                        <i class="fas fa-download"></i> Export PNG
                    </button>
                    <button class="modern-btn" style="padding: 0.8rem 1.5rem; margin: 0 0.5rem; background: linear-gradient(135deg, #48bb78, #38a169);">
                        <i class="fas fa-download"></i> Export SVG
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: rgba(255, 255, 255, 0.5); border-radius: 16px;">
                    <i class="fas fa-project-diagram" style="font-size: 4rem; color: #667eea; margin-bottom: 1rem;"></i>
                    <h3 style="color: #2d3748; margin-bottom: 1rem;">Dependency Graph Visualization</h3>
                    <p style="color: #718096;">No graph data available for this repository.</p>
                </div>
            `;
        }
    }
    
    function renderNodes(dependencies) {
        const container = document.getElementById('nodes-container');
        container.innerHTML = '';
        
        if (!dependencies || dependencies.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #718096;">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No dependencies found in this repository.</p>
                </div>
            `;
            return;
        }
        
        dependencies.forEach(dep => {
            const nodeType = getNodeType(dep.type);
            const nodeIcon = getNodeIcon(dep.type);
            
            const nodeElement = document.createElement('div');
            nodeElement.className = `modern-node ${nodeType}`;
            nodeElement.innerHTML = `
                <div class="node-icon">
                    <i class="${nodeIcon}"></i>
                </div>
                <div style="flex: 1;">
                    <h3 style="color: #2d3748; margin-bottom: 0.5rem;">${dep.name}</h3>
                    <p style="color: #718096; margin-bottom: 0.5rem;">
                        Type: ${dep.type} | 
                        Version: ${dep.version || 'Unknown'} | 
                        License: ${dep.license || 'Unknown'}
                    </p>
                    ${dep.vulnerabilities ? `
                        <p style="color: #e53e3e; margin-top: 0.5rem;">
                            <i class="fas fa-exclamation-triangle"></i> 
                            ${dep.vulnerabilities} vulnerabilities detected
                        </p>
                    ` : ''}
                </div>
            `;
            
            container.appendChild(nodeElement);
        });
    }
    
    function getNodeType(depType) {
        const typeMap = {
            'npm': 'node-type-npm',
            'python': 'node-type-python',
            'maven': 'node-type-maven',
            'repo': 'node-type-repo'
        };
        
        return typeMap[depType] || 'node-type-repo';
    }
    
    function getNodeIcon(depType) {
        const iconMap = {
            'npm': 'fab fa-node-js',
            'python': 'fab fa-python',
            'maven': 'fab fa-java',
            'repo': 'fab fa-github'
        };
        
        return iconMap[depType] || 'fas fa-box';
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        error.style.display = 'block';
        success.style.display = 'none';
        
     
    
        error.style.animation = 'errorPulse 0.5s ease-in-out';
        setTimeout(() => error.style.animation = '', 500);
    }
    
    function hideError() {
        error.style.display = 'none';
    }
    
    function showSuccess(message) {
        successMessage.textContent = message;
        success.style.display = 'block';
        error.style.display = 'none';
        
            
        success.style.animation = 'successPulse 0.5s ease-in-out';
        setTimeout(() => success.style.animation = '', 500);
    }
    
    function hideSuccess() {
        success.style.display = 'none';
    }


    const style = document.createElement('style');
    style.textContent = `
        @keyframes errorPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.3); }
            50% { box-shadow: 0 0 0 10px rgba(229, 62, 62, 0); }
        }
        
        @keyframes successPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.3); }
            50% { box-shadow: 0 0 0 10px rgba(72, 187, 120, 0); }
        }
    `;
    document.head.appendChild(style);
});