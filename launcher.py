#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import subprocess
import platform
import shutil
import time
from pathlib import Path

class Colors:
    """Couleurs pour l'affichage console."""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

def print_status(message, status_type="info"):
    """Affiche un message avec formatage selon le type."""
    prefix = {
        "info": f"[{Colors.BOLD}INFO{Colors.RESET}] ",
        "success": f"[{Colors.BOLD}{Colors.GREEN}SUCCÈS{Colors.RESET}] ",
        "warning": f"[{Colors.BOLD}{Colors.YELLOW}ATTENTION{Colors.RESET}] ",
        "error": f"[{Colors.BOLD}{Colors.RED}ERREUR{Colors.RESET}] ",
    }
    print(f"{prefix.get(status_type, prefix['info'])}{message}")

def is_windows():
    """Vérifie si le système d'exploitation est Windows."""
    return platform.system().lower() == "windows"

def run_command(command, shell=False, check=True, cwd=None, env=None):
    """Exécute une commande et retourne le résultat."""
    effective_env = os.environ.copy()
    if env:
        effective_env.update(env)

    try:
        result = subprocess.run(
            command,
            shell=shell,
            check=check,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=cwd,
            env=effective_env
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.CalledProcessError as e:
        # Assurer que stdout/stderr sont des chaînes même si None
        stdout_val = e.stdout if e.stdout is not None else ""
        stderr_val = e.stderr if e.stderr is not None else ""
        return e.returncode, stdout_val, stderr_val
    except FileNotFoundError:
        cmd_name_for_error = ""
        if shell: # command est une chaîne
            cmd_name_for_error = command.split(maxsplit=1)[0] if isinstance(command, str) else str(command)
        elif isinstance(command, list) and command: # command est une liste
            cmd_name_for_error = command[0]
        else: # Cas inconnu
            cmd_name_for_error = str(command)
        return 127, "", f"Commande non trouvée: {cmd_name_for_error}"
    except Exception as e: # Attraper d'autres exceptions potentielles
        return -1, "", f"Erreur inattendue lors de l'exécution de la commande '{str(command)}': {str(e)}"

def check_python():
    """Vérifie si Python est installé et obtient sa version."""
    print_status("Vérification de l'installation de Python...")
    
    if is_windows():
        command = ["python", "--version"]
    else:
        command = ["python3", "--version"]
        
    return_code, stdout, stderr = run_command(command, check=False)
    
    if return_code == 0:
        version = stdout.strip()
        print_status(f"Python détecté: {version}", "success")
        return True, version.split()[-1]
    else:
        print_status("Python n'est pas installé ou n'est pas dans le PATH.", "error")
        return False, None

def check_node():
    """Vérifie si Node.js est installé et obtient sa version et le chemin de npm."""
    print_status("Vérification de l'installation de Node.js...")
    node_executable_path = None
    npm_executable_path = None

    node_exe = shutil.which("node")

    if node_exe:
        node_executable_path = node_exe
        return_code, stdout, stderr = run_command([node_executable_path, "--version"], check=False)
        if return_code == 0:
            version = stdout.strip()
            print_status(f"Node.js détecté: {version} (Chemin: {node_executable_path})", "success")
            
            node_dir = Path(node_executable_path).parent
            potential_npm_cmd_path = node_dir / "npm.cmd"
            potential_npm_path = node_dir / "npm"

            if is_windows() and potential_npm_cmd_path.exists() and potential_npm_cmd_path.is_file():
                npm_executable_path = str(potential_npm_cmd_path)
                print_status(f"npm.cmd localisé à côté de node: {npm_executable_path}", "info")
            elif not is_windows() and potential_npm_path.exists() and potential_npm_path.is_file():
                npm_executable_path = str(potential_npm_path)
                print_status(f"npm localisé à côté de node: {npm_executable_path}", "info")
            else:
                npm_exe_fallback = shutil.which("npm")
                if is_windows() and not npm_exe_fallback: # Si shutil.which("npm") échoue sous Windows
                    npm_exe_fallback = shutil.which("npm.cmd") # Essayer explicitement npm.cmd
                
                if npm_exe_fallback:
                    npm_executable_path = npm_exe_fallback
                    print_status(f"npm localisé via PATH (fallback): {npm_executable_path}", "info")
                else:
                    print_status("npm.cmd (ou npm) non trouvé à côté de node ou dans le PATH via shutil.which.", "warning")
            
            if npm_executable_path:
                 print_status(f"Chemin final pour npm: {npm_executable_path}", "info")
            return True, version, npm_executable_path
        else:
            print_status(f"Node.js trouvé à {node_executable_path} mais --version a échoué: {stderr}", "error")
            return False, None, None
    else:
        print_status("Node.js n'est pas installé ou n'est pas dans le PATH (vérifié par shutil.which).", "error")
        return False, None, None

def check_pnpm(npm_exe_path):
    """Vérifie si pnpm est installé et obtient sa version."""
    print_status("Vérification de l'installation de pnpm...")
    
    # Méthode 1: Commande pnpm directe
    return_code, stdout, stderr = run_command(["pnpm", "--version"], check=False)
    
    if return_code == 0:
        version = stdout.strip()
        print_status(f"pnpm détecté (méthode directe): {version}", "success")
        return True, version

    # Méthode 2: Vérifier via npm list -g
    if is_windows() and npm_exe_path: # Vérifier aussi si npm_exe_path est fourni
        print_status("pnpm non trouvé directement, vérification via npm list -g...", "info")
        if not os.path.isfile(npm_exe_path):
            print_status(f"Le chemin npm '{npm_exe_path}' pour 'npm list -g' ne semble pas être un fichier valide.", "error")
        else:
            npm_cmd_list = [npm_exe_path, "list", "-g", "--depth=0"]
            
            # Utiliser shell=True pour .cmd sous Windows
            cmd_to_run = subprocess.list2cmdline(npm_cmd_list) if is_windows() and npm_exe_path.lower().endswith(".cmd") else npm_cmd_list
            use_shell = is_windows() and npm_exe_path.lower().endswith(".cmd")
            
            print_status(f"Exécution de la commande: {str(cmd_to_run)} (shell={use_shell})", "info")
            return_code_npm, stdout_npm, stderr_npm = run_command(cmd_to_run, shell=use_shell, check=False)

            if return_code_npm == 0:
                if "pnpm@" in stdout_npm:
                    try:
                        version_line = [line for line in stdout_npm.splitlines() if "pnpm@" in line][0]
                        version = version_line.split("pnpm@")[1].strip()
                        print_status(f"pnpm détecté (via npm list -g): {version}", "success")
                        return True, version
                    except IndexError:
                        print_status("pnpm détecté (via npm list -g, version non parsable mais présent)", "success")
                        return True, "Version inconnue (npm list)"
            # else:
            #     print_status(f"Échec de 'npm list -g' (code: {return_code_npm}): {stderr_npm.strip()}", "warning")

    # Méthode 3: Vérifier le chemin PNPM_HOME (souvent utilisé par le script d'installation de pnpm)
    pnpm_home = os.environ.get("PNPM_HOME")
    if pnpm_home and os.path.exists(os.path.join(pnpm_home, "pnpm.CMD" if is_windows() else "pnpm")):
        print_status(f"pnpm détecté via PNPM_HOME: {pnpm_home}", "info")
        # Essayer d'exécuter la commande version depuis ce chemin
        pnpm_executable = os.path.join(pnpm_home, "pnpm.CMD" if is_windows() else "pnpm")
        return_code_home, stdout_home, stderr_home = run_command([pnpm_executable, "--version"], check=False)
        if return_code_home == 0:
            version = stdout_home.strip()
            print_status(f"pnpm détecté (via PNPM_HOME executable): {version}", "success")
            return True, version
        else:
            print_status(f"pnpm trouvé dans PNPM_HOME mais impossible d'exécuter --version: {stderr_home}", "warning")
            # On le considère comme présent mais version inconnue si l'exécutable est là
            return True, "Version inconnue (PNPM_HOME)"
            
    print_status("pnpm n'est pas installé ou n'est pas dans le PATH / PNPM_HOME (après toutes vérifications).", "error")
    return False, None

def check_adb():
    """Vérifie si ADB est installé et obtient sa version."""
    print_status("Vérification de l'installation d'ADB...")
    
    return_code, stdout, stderr = run_command(["adb", "version"], check=False)
    
    if return_code == 0:
        version = stdout.strip().split("\n")[0]
        print_status(f"ADB détecté: {version}", "success")
        return True, version
    else:
        print_status("ADB n'est pas installé ou n'est pas dans le PATH.", "warning")
        return False, None

def setup_python_venv(api_dir):
    """Configure l'environnement virtuel Python si nécessaire."""
    print_status("Configuration de l'environnement virtuel Python...")
    venv_dir = os.path.join(api_dir, ".venv")
    
    # Vérifier si l'environnement virtuel existe déjà
    if os.path.exists(venv_dir):
        print_status("Environnement virtuel Python déjà existant.", "success")
    else:
        print_status("Création d'un nouvel environnement virtuel Python...")
        
        if is_windows():
            command = [sys.executable, "-m", "venv", venv_dir]
        else:
            command = ["python3", "-m", "venv", venv_dir]
        
        return_code, stdout, stderr = run_command(command, check=False)
        
        if return_code != 0:
            print_status(f"Échec de la création de l'environnement virtuel Python: {stderr}", "error")
            return False
        
        print_status("Environnement virtuel Python créé avec succès.", "success")
    
    # Installer les dépendances Python
    print_status("Installation des dépendances Python...")
    
    pip_cmd = os.path.join(venv_dir, "Scripts" if is_windows() else "bin", "pip")
    requirements_file = os.path.join(api_dir, "requirements.txt")
    
    if not os.path.exists(requirements_file):
        print_status(f"Fichier requirements.txt introuvable à {requirements_file}", "error")
        return False
    
    return_code, stdout, stderr = run_command([pip_cmd, "install", "-r", requirements_file], check=False)
    
    if return_code != 0:
        print_status(f"Échec de l'installation des dépendances Python: {stderr}", "error")
        return False
    
    print_status("Dépendances Python installées avec succès.", "success")
    return True

def install_pnpm_if_needed(npm_exe_path):
    """Installe pnpm si nécessaire."""
    if not npm_exe_path:
        print_status("Chemin vers npm non fourni. Impossible d'installer pnpm.", "error")
        print_status("Veuillez vérifier votre installation de Node.js et que npm est correctement configuré.", "info")
        print_status("Vous devrez peut-être installer pnpm manuellement: https://pnpm.io/installation", "info")
        return False
    
    print_status(f"Utilisation de npm trouvé à: {npm_exe_path} pour installer pnpm.", "info")
    if not os.path.isfile(npm_exe_path):
        print_status(f"Le chemin npm '{npm_exe_path}' ne semble pas être un fichier valide.", "error")
        return False

    print_status("Tentative d'installation de pnpm via npm (méthode recommandée)...", "info")
    
    install_cmd_list = [npm_exe_path, "install", "-g", "pnpm"]
    
    # Utiliser shell=True pour .cmd sous Windows
    cmd_to_run = subprocess.list2cmdline(install_cmd_list) if is_windows() and npm_exe_path.lower().endswith(".cmd") else install_cmd_list
    use_shell = is_windows() and npm_exe_path.lower().endswith(".cmd")

    print_status(f"Exécution de la commande: {str(cmd_to_run)} (shell={use_shell})", "info")
    return_code, stdout, stderr = run_command(cmd_to_run, shell=use_shell, check=False)
    
    if return_code != 0:
        print_status(f"Échec de l'installation de pnpm via npm (code: {return_code}): {stderr.strip()}", "error")
        if stdout.strip():
            print_status(f"Sortie standard de npm: {stdout.strip()}", "info")
        print_status("Si l'erreur persiste, veuillez installer pnpm manuellement: https://pnpm.io/installation", "info")
        return False
    
    print_status("pnpm installé avec succès via npm. Il est recommandé de redémarrer ce script (ou votre terminal) pour que les changements de PATH soient pris en compte pour pnpm.", "success")
    return True

def install_node_dependencies(project_root):
    """Installe les dépendances Node.js."""
    print_status("Installation des dépendances Node.js...")
    
    # On doit être dans le répertoire racine du projet pour que pnpm fonctionne correctement
    # La commande pnpm sera recherchée dans le PATH système
    # ou via PNPM_HOME si configuré.
    
    # Les commandes "pnpm install" et "pnpm dev" sont généralement exécutées par le shell
    # qui devrait résoudre pnpm via le PATH.
    # Si pnpm a été installé globalement via npm, il devrait être dans le PATH.
    # Si installé via le script stand-alone, PNPM_HOME devrait être configuré.

    pnpm_command = ["pnpm", "install"]
    use_shell_for_pnpm = is_windows() # Pour être sûr avec pnpm.CMD
    command_to_run = subprocess.list2cmdline(pnpm_command) if use_shell_for_pnpm else pnpm_command

    return_code, stdout, stderr = run_command(command_to_run, shell=use_shell_for_pnpm, check=False, cwd=project_root)
        
    if return_code != 0:
        print_status(f"Échec de l'installation des dépendances Node.js: {stderr}", "error")
        print_status(f"Sortie standard de pnpm: {stdout}", "info")
        return False
    
    print_status("Dépendances Node.js installées avec succès.", "success")
    return True

def start_application(project_root):
    """Démarre l'application (API et frontend)."""
    print_status("Démarrage de l'application...", "info")
    
    # Comme pour install_node_dependencies, pnpm dev sera résolu par le shell
    
    if is_windows():
        # Sous Windows, pour lancer une nouvelle fenêtre de commande qui reste ouverte (avec /k)
        # et exécute pnpm dev, la meilleure approche est d'utiliser `start cmd /k ...`
        # On ne peut pas directement utiliser Popen avec shell=True de la même manière que pour
        # capturer la sortie, car on veut une nouvelle fenêtre.
        # On construit la chaîne de commande pour `start cmd /k`
        
        # S'assurer que pnpm est bien dans le PATH de la nouvelle console ou que PNPM_HOME est actif.
        # Si pnpm est dans PNPM_HOME, il faut s'assurer que PNPM_HOME est dans le PATH de la nouvelle console.
        # L'utilisation de `pnpm.CMD dev` directement peut aussi fonctionner si `pnpm.CMD` est dans le PATH
        # ou si on fournit son chemin complet.
        # Pour la simplicité, on se fie au PATH pour le moment.
        start_command = f'start cmd /k "cd /d {project_root} && pnpm dev"'
        print_status(f"Exécution de : {start_command}", "info")
        subprocess.Popen(start_command, shell=True)

    else: # Pour Linux et macOS
        # Créer un environnement séparé pour que Popen ne bloque pas
        # Ici on lance pnpm dev dans le fond.
        # Il est important que project_root soit le CWD pour cette commande.
        subprocess.Popen(["pnpm", "dev"], cwd=project_root) 
    
    print_status("Serveur de développement pnpm démarré (ou tentative de démarrage dans une nouvelle fenêtre).", "success")
    print_status("L'interface web devrait être accessible à http://localhost:3000", "success")
    print_status("L'API devrait être accessible à http://localhost:8000", "success")
    return True

def welcome_message():
    """Affiche un message de bienvenue."""
    print("\n" + "="*80)
    print(f"{Colors.BOLD}Bienvenue dans le lanceur de l'application DIMI{Colors.RESET}")
    print("Ce script va vérifier les dépendances et lancer l'application.")
    print("="*80 + "\n")

def ensure_browser_opens(url="http://localhost:3000"):
    """Ouvre le navigateur par défaut à l'URL spécifiée après un court délai."""
    print_status(f"Ouverture du navigateur à {url} dans 5 secondes...", "info")
    time.sleep(5)  # Attendre que le serveur démarre
    
    try:
        import webbrowser
        webbrowser.open(url)
        print_status(f"Tentative d'ouverture de {url} avec le module webbrowser.", "info")
    except Exception as e_wb:
        print_status(f"Échec de l'ouverture avec webbrowser: {e_wb}. Tentative avec des commandes OS spécifiques.", "warning")
        if is_windows():
            os.system(f'start {url}')
        elif platform.system() == 'Darwin':  # macOS
            os.system(f'open {url}')
        else:  # Linux
            try:
                # Essayer xdg-open en premier, c'est la méthode préférée sur la plupart des Linux modernes
                subprocess.run(['xdg-open', url], check=True)
            except (FileNotFoundError, subprocess.CalledProcessError):
                print_status("xdg-open a échoué. Essai avec d'autres navigateurs...", "warning")
                # Fallback vers d'autres commandes si xdg-open n'est pas disponible ou échoue
                os.system(f'sensible-browser {url} || x-www-browser {url} || gnome-open {url} || firefox {url} || google-chrome {url}')


def main():
    """Fonction principale."""
    welcome_message()
    
    # Déterminer le chemin du projet
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = script_dir
    
    # Vérifier les chemins des sous-dossiers
    api_dir = os.path.join(project_root, "apps", "api")
    web_dir = os.path.join(project_root, "apps", "web")
    
    if not os.path.exists(api_dir) or not os.path.exists(web_dir):
        print_status("Structure de projet incorrecte. Vérifiez que vous exécutez ce script depuis le répertoire racine du projet.", "error")
        return False
    
    # Vérifier les dépendances
    python_ok, _ = check_python()
    node_ok, _, npm_path = check_node() # npm_path est le chemin complet vers npm (ou npm.cmd)
    
    adb_ok, _ = check_adb()  # ADB est optionnel
    
    if not python_ok:
        print_status("Python est requis et n'est pas installé. Veuillez l'installer: https://www.python.org/downloads/", "error")
        return False
    
    if not node_ok: # Si node n'est pas ok, npm_path sera None (ou node_ok sera False)
        print_status("Node.js est requis. Impossible de continuer sans Node.js. Veuillez l'installer: https://nodejs.org/", "error")
        return False
    
    # Vérifier pnpm après avoir node_ok et npm_path
    pnpm_ok, _ = check_pnpm(npm_path) # Passer npm_path à check_pnpm

    if not pnpm_ok:
        print_status("pnpm n'est pas détecté. Tentative d'installation...", "warning")
        if not install_pnpm_if_needed(npm_path): # MODIFIÉ: passer npm_path
            return False 
        print_status("pnpm a été installé. Veuillez relancer ce script (start.bat) pour que les changements du PATH ou de PNPM_HOME soient pris en compte.", "info")
        sys.exit(0) 
    
    if not adb_ok:
        print_status("ADB n'est pas installé. Certaines fonctionnalités liées aux téléphones Android pourraient ne pas fonctionner.", "warning")
        print_status("Pour installer ADB: https://developer.android.com/studio/releases/platform-tools", "info")
    
    # Configurer l'environnement Python
    if not setup_python_venv(api_dir):
        return False
    
    # Installer les dépendances Node.js
    if not install_node_dependencies(project_root):
        return False
    
    # Démarrer l'application
    if not start_application(project_root):
        return False
    
    # Ouvrir le navigateur
    ensure_browser_opens()
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            print_status("Le démarrage de l'application a échoué. Veuillez résoudre les problèmes ci-dessus et réessayer.", "error")
            if is_windows():
                os.system("pause") # Garde la console ouverte sous Windows en cas d'échec
            sys.exit(1)
        else:
            print_status("Le lanceur a terminé ses opérations. L'application devrait être en cours d'exécution.", "info")
            if is_windows():
                print_status("Vous pouvez fermer cette fenêtre de lanceur si l'application est démarrée dans une autre console.", "info")
                # os.system("pause") # Optionnel: pour garder la fenêtre du lanceur ouverte
    except KeyboardInterrupt:
        print_status("\nOpération annulée par l'utilisateur.", "warning")
        if is_windows():
            os.system("pause")
        sys.exit(1)
    except Exception as e:
        print_status(f"Une erreur inattendue et non gérée s'est produite dans le lanceur: {str(e)}", "error")
        import traceback
        traceback.print_exc()
        if is_windows():
            os.system("pause")
        sys.exit(1) 