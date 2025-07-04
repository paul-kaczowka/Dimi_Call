@echo off
echo ===============================================================================
echo                        DIMI - DÉMARRAGE DE L'APPLICATION
echo ===============================================================================
echo.

:: Vérifier si Python est installé
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Python n'est pas installé ou n'est pas dans le PATH.
    echo Veuillez installer Python depuis https://www.python.org/downloads/
    echo.
    echo Appuyez sur une touche pour fermer cette fenêtre...
    pause >nul
    exit /b 1
)

:: Lancer le launcher Python
echo [INFO] Lancement du programme...
python launcher.py

:: Si une erreur se produit, garder la fenêtre ouverte
if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Une erreur s'est produite lors du lancement de l'application.
    echo.
    echo Appuyez sur une touche pour fermer cette fenêtre...
    pause >nul
    exit /b %errorlevel%
)

:: Sortie normale (le launcher s'occupe d'ouvrir le navigateur)
exit /b 0 