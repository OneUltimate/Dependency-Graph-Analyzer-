from flask import Flask, render_template, request, jsonify
import requests
import networkx as nx
import matplotlib.pyplot as plt
import io
import base64
import re
import os
import json
import ast
import tempfile
import subprocess
import shutil
import stat
from pathlib import Path
import time

app = Flask(__name__)

class PythonImportAnalyzer:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.temp_dir = None
        self.saved_readme_content = None  
    
    owner = ""
      
    def extract_owner_repo(self, github_url):
        patterns = [
            r'github\.com[/:]([^/]+)/([^/]+)',
            r'git@github\.com:([^/]+)/([^/]+)\.git'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, github_url)
            if match:
                owner = match.group(1)
                repo = match.group(2).replace('.git', '')
                
                
                
                return owner, repo
            
            
        return None, None
    
    def remove_readonly(self, func, path, excinfo):
        try:
            os.chmod(path, stat.S_IWRITE)
            func(path)
        except Exception as e:
            print(f"Failed to remove {path}: {e}")
    
    def clone_repository(self, github_url):
        temp_dir = None
        try:
            temp_dir = tempfile.mkdtemp()
            print(f"Cloning repository to: {temp_dir}")
            
            clone_cmd = ['git', 'clone', '--depth', '1', github_url, temp_dir]
            result = subprocess.run(clone_cmd, capture_output=True, text=True, timeout=120)
            
            if result.returncode != 0:
                print("Trying git clone without depth...")
                clone_cmd = ['git', 'clone', github_url, temp_dir]
                result = subprocess.run(clone_cmd, capture_output=True, text=True, timeout=180)
                
                if result.returncode != 0:
                    raise Exception(f"Git clone failed: {result.stderr}")
            
            if not os.path.exists(temp_dir) or not os.listdir(temp_dir):
                raise Exception("Cloned directory is empty or does not exist")
            
            print(f"Successfully cloned repository to {temp_dir}")
            return temp_dir, None
            
        except subprocess.TimeoutExpired:
            if temp_dir and os.path.exists(temp_dir):
                self.safe_cleanup(temp_dir)
            return None, "Repository cloning timed out"
        except Exception as e:
            if temp_dir and os.path.exists(temp_dir):
                self.safe_cleanup(temp_dir)
            return None, f"Failed to clone repository: {str(e)}"
    
    def safe_cleanup(self, temp_dir):
        if temp_dir and os.path.exists(temp_dir):
            try:
                time.sleep(0.1)
                shutil.rmtree(temp_dir, onerror=self.remove_readonly)
                print(f"Successfully cleaned up: {temp_dir}")
            except Exception as e:
                print(f"Warning: Could not cleanup temp directory {temp_dir}: {e}")
    
    def find_python_files(self, directory):
        python_files = []
        try:
            if not directory or not os.path.exists(directory):
                print(f"Directory does not exist: {directory}")
                return python_files
                
            for root, dirs, files in os.walk(directory):
                dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['__pycache__', 'env', 'venv', '.git']]
                
                for file in files:
                    if file.endswith('.py'):
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, directory)
                        python_files.append({
                            'full_path': full_path,
                            'rel_path': rel_path,
                            'name': file
                        })
            print(f"Found {len(python_files)} Python files in {directory}")
        except Exception as e:
            print(f"Error finding Python files in {directory}: {e}")
        
        return python_files
    
    def extract_imports(self, file_path):
        imports = []
        
        try:
            if not os.path.exists(file_path):
                print(f"File does not exist: {file_path}")
                return imports
                
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append({
                            'type': 'import',
                            'module': alias.name,
                            'alias': alias.asname,
                            'level': 0
                        })
                
                elif isinstance(node, ast.ImportFrom):
                    module_name = node.module if node.module else ""
                    
                    for alias in node.names:
                        imports.append({
                            'type': 'from_import',
                            'module': module_name,
                            'name': alias.name,
                            'alias': alias.asname,
                            'level': node.level
                        })
        
        except SyntaxError as e:
            print(f"Syntax error in {file_path}: {e}")
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
        
        return imports
    
    def resolve_local_module(self, module_name, current_file_path, all_files, temp_dir):
        if not module_name or not temp_dir:
            return None
            
        current_dir = os.path.dirname(current_file_path)
        
        possible_paths = [
            os.path.join(current_dir, f"{module_name.replace('.', '/')}.py"),
            os.path.join(current_dir, f"{module_name.replace('.', '/')}", "__init__.py"),
            os.path.join(temp_dir, f"{module_name.replace('.', '/')}.py"),
            os.path.join(temp_dir, f"{module_name.replace('.', '/')}", "__init__.py"),
        ]
        
        for path in possible_paths:
            if os.path.exists(path) and any(f['full_path'] == path for f in all_files):
                return os.path.relpath(path, temp_dir)
        
        return None
    
    def is_standard_library(self, module_name):
        standard_libs = {
            'os', 'sys', 'json', 're', 'math', 'datetime', 'collections',
            'itertools', 'functools', 'threading', 'multiprocessing', 'asyncio',
            'subprocess', 'pathlib', 'shutil', 'tempfile', 'logging', 'ast',
            'base64', 'io', 'urllib', 'http', 'ssl', 'hashlib', 'random',
            'string', 'time', 'calendar', 'decimal', 'fractions', 'statistics'
        }
        return module_name.split('.')[0] in standard_libs
    
    def get_readme_content(self, temp_dir):
        if not temp_dir or not os.path.exists(temp_dir):
            return None
            
        readme_files = ['README.md', 'README.rst', 'README.txt', 'README']
        
        for readme_file in readme_files:
            readme_path = os.path.join(temp_dir, readme_file)
            if os.path.exists(readme_path):
                try:
                    with open(readme_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
        
                        
                    return content[:500] + '...' if len(content) > 500 else content
                except Exception as e:
                    print(f"Error reading README: {e}")
        return None
    
    def build_import_graph(self, github_url):
        temp_dir, error = self.clone_repository(github_url)
        if error:
            return None, error
        
        try:
            python_files = self.find_python_files(temp_dir)
            if not python_files:
                self.safe_cleanup(temp_dir)
                return None, "No Python files found in repository"
            
            self.graph = nx.DiGraph()
            all_imports = []
            
            for file_info in python_files:
                file_path = file_info['rel_path']
                self.graph.add_node(file_path, type='python_file', language='Python')
                
                imports = self.extract_imports(file_info['full_path'])
                for imp in imports:
                    imp['file'] = file_path
                    all_imports.append(imp)
            
            print(f"Found {len(all_imports)} imports total")
            
            external_modules = set()
            local_edges = 0
            external_edges = 0
            
            for imp in all_imports:
                source_file = imp['file']
                module_name = imp['module']
                
                if not module_name:
                    continue
                
                source_full_path = os.path.join(temp_dir, source_file)
                local_path = self.resolve_local_module(module_name, source_full_path, python_files, temp_dir)
                
                if local_path:
                    self.graph.add_edge(source_file, local_path, 
                                      import_type=imp['type'],
                                      imported_name=imp.get('name'))
                    local_edges += 1
                else:
                    base_module = module_name.split('.')[0]
                    if self.is_standard_library(base_module):
                        external_node = f"stdlib:{base_module}"
                        node_type = 'standard_lib'
                    else:
                        external_node = f"external:{base_module}"
                        node_type = 'external_package'
                    
                    external_modules.add((external_node, node_type))
                    self.graph.add_node(external_node, type=node_type, language='Python')
                    self.graph.add_edge(source_file, external_node,
                                      import_type=imp['type'],
                                      imported_name=imp.get('name'))
                    external_edges += 1
            
            print(f"Created {local_edges} local edges and {external_edges} external edges")
            
            for ext_node, node_type in external_modules:
                self.graph.nodes[ext_node]['type'] = node_type
            
            
            self.saved_readme_content = self.get_readme_content(temp_dir)
            
            return self.graph, None
            
        except Exception as e:
            self.safe_cleanup(temp_dir)
            return None, f"Error building graph: {str(e)}"
        finally:
            self.safe_cleanup(temp_dir)
    
    def generate_graph_image(self):
        if len(self.graph.nodes) == 0:
            return None
        try:
            plt.figure(figsize=(16, 12))
            
            node_colors = []
            node_sizes = []
            labels = {}
            
            for node in self.graph.nodes():
                node_type = self.graph.nodes[node].get('type', 'unknown')
                
                if node.startswith('stdlib:'):
                    labels[node] = node.replace('stdlib:', '')
                elif node.startswith('external:'):
                    labels[node] = node.replace('external:', '')
                else:
                    labels[node] = os.path.basename(node)
                
                if node_type == 'python_file':
                    node_colors.append('lightblue')
                    node_sizes.append(1200)
                elif node_type == 'standard_lib':
                    node_colors.append('lightgreen')
                    node_sizes.append(1000)
                elif node_type == 'external_package':
                    node_colors.append('lightcoral')
                    node_sizes.append(1000)
                else:
                    node_colors.append('lightyellow')
                    node_sizes.append(800)
            
            pos = nx.spring_layout(self.graph, k=1.5, iterations=50)
            
           
            nx.draw(self.graph, pos, 
                    labels=labels,
                    node_color=node_colors,
                    node_size=node_sizes,
                    font_size=7,
                    font_weight='bold',
                    arrows=True,
                    edge_color='gray',
                    alpha=0.8,
                    linewidths=0.5)
            
            plt.title("Python Import Dependency Graph", fontsize=14, pad=20)
            
            img = io.BytesIO()
            plt.savefig(img, format='png', bbox_inches='tight', dpi=120, facecolor='white')
            img.seek(0)
            plt.close()
            
            return base64.b64encode(img.getvalue()).decode()
            
        except Exception as e:
            print(f"Error generating graph image: {e}")
            return None

analyzer = PythonImportAnalyzer()

@app.route('/')
def index():
    return render_template('index.html', creator_name="Aleksej")  

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    
    github_url = data.get('github_url')
    if not github_url:
        return jsonify({'error': 'GitHub URL is required'}), 400
    
    owner, repo = analyzer.extract_owner_repo(github_url)
    if not owner or not repo:
        return jsonify({'error': 'Invalid GitHub URL format'}), 400
    
    try:
        print(f"Analyzing repository: {owner}/{repo}")
        
        graph, error = analyzer.build_import_graph(github_url)
        if error:
            return jsonify({'error': error}), 400
        
        graph_image = analyzer.generate_graph_image()
        
       
        readme_preview = analyzer.saved_readme_content
        
        nodes_info = []
        file_count = 0
        external_count = 0
        std_lib_count = 0
        
        for node in graph.nodes():
            node_data = graph.nodes[node]
            node_type = node_data.get('type', 'unknown')
            
            if node_type == 'python_file':
                file_count += 1
            elif node_type == 'external_package':
                external_count += 1
            elif node_type == 'standard_lib':
                std_lib_count += 1
            
            dependencies_count = len(list(graph.successors(node)))
            
            nodes_info.append({
                'name': node,
                'type': node_type,
                'dependencies': dependencies_count
            })
        
        nodes_info.sort(key=lambda x: x['dependencies'], reverse=True)
        
        response_data = {
            'success': True,
            'graph_image': graph_image,
            'dependencies': nodes_info,
            'readme_preview': f'{owner} = {readme_preview}',
            'stats': {
                'totalFiles': file_count,
                'externalPackages': external_count,
                'standardLibraries': std_lib_count,
                'totalDependencies': len(graph.edges()),
                'vulnerabilities': 0
            },
            'repo_name': f"{owner}/{repo}",
            'project_description': f"Анализ зависимостей Python проектов | Создатель: Aleksej"
        }
        
        print(f"Analysis completed successfully")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({'error': f"Analysis failed: {str(e)}"}), 400

if __name__ == '__main__':
    app.run(debug=True)