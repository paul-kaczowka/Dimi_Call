@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo DimiCall - Script de mise a jour automatique
echo ===================================================
echo.

:: Vérifier si Git est installé
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERREUR: Git n'est pas installe ou n'est pas dans le PATH.
    echo Veuillez installer Git depuis https://git-scm.com/downloads
    pause
    exit /b 1
)

:: Vérifier si le dossier courant est un dépôt Git
if not exist ".git" (
    echo Ce dossier n'est pas un depot Git.
    echo Deux options:
    echo 1. Cloner le depot pour la premiere fois
    echo 2. Le dossier existe mais n'est pas initialise
    echo.
    
    set /p OPTION="Choisir une option (1 ou 2): "
    
    if "!OPTION!"=="1" (
        :: Opération de clone
        cd ..
        echo Clonage du depot GitHub en cours...
        git clone https://github.com/paul-kaczowka/DimiCall.git
        if !ERRORLEVEL! neq 0 (
            echo ERREUR: Impossible de cloner le depot.
            pause
            exit /b 1
        )
        echo Depot clone avec succes! Entrez dans le dossier DimiCall et executez update.bat a nouveau.
        pause
        exit /b 0
    ) else if "!OPTION!"=="2" (
        :: Initialisation du dépôt Git
        echo Initialisation du depot Git...
        git init
        git remote add origin https://github.com/paul-kaczowka/DimiCall.git
        echo Depot initialise, poursuite de la mise a jour...
    ) else (
        echo Option invalide.
        pause
        exit /b 1
    )
)

:: Sauvegarde des modifications locales au cas où
echo Sauvegarde temporaire des modifications locales...
git stash -u

:: Récupération des dernières modifications
echo Recuperation des dernieres modifications...
git fetch origin
if %ERRORLEVEL% neq 0 (
    echo ERREUR: Impossible de recuperer les modifications du serveur.
    echo Verifiez votre connexion Internet et l'acces au depot.
    git stash pop
    pause
    exit /b 1
)

:: Vérification de la branche actuelle
for /f "tokens=*" %%a in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%a
echo Branche actuelle: %CURRENT_BRANCH%

:: Mise à jour du code
echo Mise a jour du code source...
git pull origin %CURRENT_BRANCH%
if %ERRORLEVEL% neq 0 (
    echo AVERTISSEMENT: Des conflits pourraient exister. Tentative de reinitialisation forcee...
    
    set /p RESET="Reinitialiser tout le code avec la version en ligne? (o/n): "
    if /i "!RESET!"=="o" (
        echo Reinitialisation forcee du code...
        git reset --hard origin/%CURRENT_BRANCH%
        
        echo Suppression des fichiers non suivis...
        git clean -fd
    ) else (
        echo Mise a jour annulee. Restauration des modifications locales...
        git stash pop
        pause
        exit /b 1
    )
)

:: Installation des dépendances si package.json existe
if exist "package.json" (
    echo Detection de package.json - Verification des dependances...
    
    :: Vérifier si pnpm est installé
    where pnpm >nul 2>nul
    if !ERRORLEVEL! equ 0 (
        echo Mise a jour des dependances avec pnpm...
        pnpm install
    ) else (
        :: Vérifier si npm est installé
        where npm >nul 2>nul
        if !ERRORLEVEL! equ 0 (
            echo PNPM non trouve, utilisation de npm a la place...
            npm install
        ) else (
            echo AVERTISSEMENT: Ni pnpm ni npm ne sont installes. Les dependances n'ont pas ete mises a jour.
        )
    )
)

:: Vérifier les scripts Python et les dépendances
if exist "requirements.txt" (
    echo Detection de requirements.txt - Verification des dependances Python...
    
    :: Vérifier si Python est installé
    where python >nul 2>nul || where python3 >nul 2>nul
    if !ERRORLEVEL! equ 0 (
        echo Mise a jour des dependances Python...
        if exist ".venv" (
            echo Environnement virtuel detecte...
            if exist ".venv\Scripts\activate.bat" (
                call .venv\Scripts\activate.bat
            ) else if exist ".venv\bin\activate" (
                echo Impossible d'activer l'environnement virtuel sous Windows.
            )
        ) else (
            echo Creation d'un nouvel environnement virtuel...
            python -m venv .venv
            call .venv\Scripts\activate.bat
        )
        
        pip install -r requirements.txt
        
        :: Désactiver l'environnement virtuel si activé
        if defined VIRTUAL_ENV (
            call deactivate
        )
    ) else (
        echo AVERTISSEMENT: Python n'est pas installe. Les dependances Python n'ont pas ete mises a jour.
    )
)

echo.
echo ===================================================
echo Mise a jour terminee avec succes!
echo ===================================================
echo.

pause 