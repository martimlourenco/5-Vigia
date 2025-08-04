// Estado global da aplicação
const app = {
    currentCalendar: 'calendar1',
    selectedDates: [],
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    galleries: {
        alojamento1: [],
        alojamento2: []
    },
    currentGalleryIndex: 0,
    currentGallery: 'alojamento1',
    modalZoomLevel: 1,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    imagePosition: { x: 0, y: 0 },

    // Configuração do EmailJS - CONFIGURADO E PRONTO!
    emailjs: {
        serviceId: 'service_e1cp3rh',
        templateId: 'template_xleddav',
        publicKey: 'nCOa0AvmVhWz070PC'
    },
    // URLs dos iCal directos do Booking.com com proxy CORS para GitHub Pages
    icalUrls: {
        alojamento1: 'https://api.allorigins.win/raw?url=https://ical.booking.com/v1/export?t=a81c3dff-fbdd-4868-86a4-cd027938b5d0',    // Vigia's Guest House
        alojamento2: 'https://api.allorigins.win/raw?url=https://ical.booking.com/v1/export?t=ee9a5a09-c9d7-4a49-897b-c224dd49b5b4'     // Cantinho das Quintãs
    },
    // Dados do Booking - SERÃO CARREGADOS DO iCAL em tempo real
    bookingData: {
        alojamento1: {
            // Iniciar VAZIO - será preenchido pelos dados reais do Booking.com
            occupiedDates: []
        },
        alojamento2: {
            // Iniciar VAZIO - será preenchido pelos dados reais do Booking.com
            occupiedDates: []
        }
    }
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    hideLoadingScreen();
    initializeEmailJS();
    setupNavigation();
    setupCalendars();
    setupGalleries();
    setupContactForm();
    setupModals();
    setupScrollEffects();
    setupViewMoreButtons();
    
    // Carregar dados reais do Booking.com
    await updateBookingData();
    
    // Renderizar calendários com dados reais
    renderCalendar('calendar1');
    renderCalendar('calendar2');
}

// Inicializar EmailJS
function initializeEmailJS() {
    // Inicializar EmailJS com a public key
    if (typeof emailjs !== 'undefined') {
        emailjs.init(app.emailjs.publicKey);
        console.log('✅ EmailJS inicializado');
    } else {
        console.warn('⚠️ EmailJS não carregado');
    }
}

// Loading Screen
function hideLoadingScreen() {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1500);
}

// Setup dos botões "Ver Mais" e cards
function setupViewMoreButtons() {
    const viewMoreButtons = document.querySelectorAll('.btn-view-more');
    viewMoreButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const target = button.dataset.target;
            if (target === 'alojamento1') {
                openGallery('alojamento1');
            } else if (target === 'alojamento2') {
                openGallery('alojamento2');
            }
        });
    });
    
    // Adicionar evento de clique também às imagens dos cards
    const cardImages = document.querySelectorAll('.card-image');
    cardImages.forEach((cardImage, index) => {
        cardImage.addEventListener('click', () => {
            const accommodation = index === 0 ? 'alojamento1' : 'alojamento2';
            openGallery(accommodation);
        });
        
        // Adicionar cursor pointer para indicar que é clicável
        cardImage.style.cursor = 'pointer';
    });
}

// Navegação
function setupNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
            
            // Atualizar link ativo
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });
}

// Sistema de Calendário
function setupCalendars() {
    // Setup calendar tabs
    const calendarTabs = document.querySelectorAll('.tab-btn');
    calendarTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.target;
            switchCalendarTab(target);
        });
    });
}

function switchCalendarTab(target) {
    // Update tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-target="${target}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.calendar-tab').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(target).classList.add('active');
    
    app.currentCalendar = target;
    app.selectedDates = []; // Reset selected dates when switching
    updateSelectedDatesDisplay();
    
    // NOVO: Sincronizar galeria com calendário automaticamente
    const galleryTarget = target === 'calendar1' ? 'gallery1' : 'gallery2';
    syncGalleryWithCalendar(galleryTarget);
}

function renderCalendar(calendarId) {
    const calendar = document.getElementById(`${calendarId}-grid`);
    const titleElement = document.getElementById(`${calendarId}-title`);
    
    if (!calendar || !titleElement) return;

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    titleElement.textContent = `${monthNames[app.currentMonth]} ${app.currentYear}`;
    
    const firstDay = new Date(app.currentYear, app.currentMonth, 1);
    const lastDay = new Date(app.currentYear, app.currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    calendar.innerHTML = '';
    
    // Add day headers
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day header';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });
    
    // Add calendar days
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = currentDate.getDate();
        
        // CORRIGIDO: Criar dateString sem problemas de timezone
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        // Adicionar atributo data-date para a função fillIntermediateDates
        dayElement.setAttribute('data-date', dateString);
        
        const accommodation = calendarId === 'calendar1' ? 'alojamento1' : 'alojamento2';
        
        // Check if date is in current month
        if (currentDate.getMonth() !== app.currentMonth) {
            dayElement.classList.add('other-month');
        } else {
            // Check if date is in the past
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);
            
            if (currentDate < today) {
                dayElement.classList.add('past');
                dayElement.style.opacity = '0.3';
                dayElement.style.cursor = 'not-allowed';
            } else {
                // Check booking status
                if (app.bookingData[accommodation].occupiedDates.includes(dateString)) {
                    dayElement.classList.add('occupied');
                } else {
                    dayElement.classList.add('available');
                    dayElement.addEventListener('click', () => selectDate(dateString, dayElement));
                }
            }
        }
        
        // Check if date is selected
        if (app.selectedDates.includes(dateString)) {
            dayElement.classList.add('selected');
        }
        
        calendar.appendChild(dayElement);
    }
    
    // Aplicar dias intermédios se há 2 ou mais datas selecionadas
    if (app.selectedDates.length >= 2) {
        fillIntermediateDates();
    }
}

function selectDate(dateString, element) {
    // Verificar se a data está ocupada
    if (element.classList.contains('occupied')) {
        alert('❌ Esta data já está ocupada e não pode ser selecionada.');
        return;
    }
    
    const index = app.selectedDates.indexOf(dateString);
    
    if (index > -1) {
        // Deselect date - remover também dias intermédios
        app.selectedDates.splice(index, 1);
        element.classList.remove('selected');
        
        // Limpar dias intermédios sem re-renderizar todo o calendário
        clearIntermediateDates();
        
        // Se ainda há datas selecionadas, re-aplicar os intermédios
        if (app.selectedDates.length >= 2) {
            fillIntermediateDates();
        }
    } else {
        // NOVA LÓGICA: Limitar a máximo 2 datas (início e fim)
        if (app.selectedDates.length >= 2) {
            // Se já há 2 datas, limpar tudo e começar nova seleção
            app.selectedDates = [];
            clearIntermediateDates();
            
            // Remover classe 'selected' de todos os dias
            const allDays = document.querySelectorAll(`#${app.currentCalendar}-grid .calendar-day`);
            allDays.forEach(day => day.classList.remove('selected'));
        }
        
        // Verificar se a nova seleção cria um período válido
        const newSelection = [...app.selectedDates, dateString].sort();
        
        if (!isDateRangeValid(newSelection)) {
            alert('❌ Não é possível selecionar este período porque há datas ocupadas no meio.\n\nPor favor, escolha um período sem datas ocupadas.');
            return;
        }
        
        // Select date
        app.selectedDates.push(dateString);
        element.classList.add('selected');
        
        // Se temos 2 datas, preencher os dias intermédios
        if (app.selectedDates.length === 2) {
            fillIntermediateDates();
        }
    }
    
    // Sort selected dates
    app.selectedDates.sort();
    updateSelectedDatesDisplay();
}

// Nova função para validar se um período de datas é válido (sem ocupadas no meio)
function isDateRangeValid(selectedDates) {
    if (selectedDates.length <= 1) return true;
    
    // Ordenar datas
    const sortedDates = selectedDates.sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];
    
    // Obter datas ocupadas do alojamento actual
    const currentAccommodation = app.currentCalendar === 'calendar1' ? 'alojamento1' : 'alojamento2';
    const occupiedDates = app.bookingData[currentAccommodation].occupiedDates;
    
    // Verificar se há datas ocupadas entre o início e o fim
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    
    for (const occupiedDate of occupiedDates) {
        const occupiedTime = new Date(occupiedDate).getTime();
        
        // Se há uma data ocupada entre o início e fim (exclusive), é inválido
        if (occupiedTime > startTime && occupiedTime < endTime) {
            console.log(`❌ Data ocupada encontrada no meio do período: ${occupiedDate}`);
            return false;
        }
        
        // Se alguma data selecionada está ocupada, é inválido
        if (selectedDates.includes(occupiedDate)) {
            console.log(`❌ Data selecionada está ocupada: ${occupiedDate}`);
            return false;
        }
    }
    
    return true;
}

// NOVA FUNÇÃO: Limpar dias intermédios sem re-renderizar calendário
function clearIntermediateDates() {
    const calendarDays = document.querySelectorAll(`#${app.currentCalendar}-grid .calendar-day`);
    
    calendarDays.forEach(dayElement => {
        dayElement.classList.remove('intermediate');
    });
}

// NOVA FUNÇÃO: Preencher dias intermédios com cor mais leve
function fillIntermediateDates() {
    if (app.selectedDates.length < 2) return;
    
    const sortedDates = [...app.selectedDates].sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];
    
    console.log(`🎯 Preenchendo dias intermédios de ${startDate} até ${endDate}`);
    
    // Gerar todas as datas entre início e fim
    const intermediateDates = getDatesBetween(startDate, endDate);
    
    // Adicionar a data final (getDatesBetween exclui o último dia)
    intermediateDates.push(endDate);
    
    // Aplicar classes visuais no calendário
    const calendarDays = document.querySelectorAll(`#${app.currentCalendar}-grid .calendar-day`);
    
    calendarDays.forEach(dayElement => {
        // Recuperar a data deste elemento (guardada como data attribute)
        const dayDate = dayElement.getAttribute('data-date');
        
        if (dayDate && intermediateDates.includes(dayDate)) {
            if (app.selectedDates.includes(dayDate)) {
                // Datas clicadas - cor forte
                dayElement.classList.add('selected');
                dayElement.classList.remove('intermediate');
            } else {
                // Datas intermédias - cor suave
                dayElement.classList.add('intermediate');
                dayElement.classList.remove('selected');
            }
        }
    });
}

function updateSelectedDatesDisplay() {
    const display = document.getElementById('selected-dates-display');
    const contactBtn = document.getElementById('contact-booking');
    
    if (app.selectedDates.length === 0) {
        display.textContent = 'Seleccione as datas desejadas no calendário';
        contactBtn.disabled = true;
    } else {
        // CORRIGIDO: Usar parsing direto sem timezone problems
        const formattedDates = app.selectedDates.map(date => {
            // date está no formato "2025-08-18" 
            const [year, month, day] = date.split('-');
            return `${day}/${month}/${year}`;
        });
        
        if (formattedDates.length === 1) {
            display.textContent = `Data selecionada: ${formattedDates[0]}`;
        } else {
            display.textContent = `Datas selecionadas: ${formattedDates.join(', ')}`;
        }
        
        contactBtn.disabled = false;
        
        // Update contact form with selected dates - SEM TIMEZONE ISSUES
        const datesInput = document.getElementById('dates');
        if (datesInput) {
            if (formattedDates.length >= 2) {
                // Mostrar sempre primeira e última data selecionada
                datesInput.value = `${formattedDates[0]} - ${formattedDates[formattedDates.length - 1]}`;
            } else {
                datesInput.value = formattedDates.join(', ');
            }
        }
    }
}

function changeMonth(direction, calendarId) {
    app.currentMonth += direction;
    
    if (app.currentMonth > 11) {
        app.currentMonth = 0;
        app.currentYear++;
    } else if (app.currentMonth < 0) {
        app.currentMonth = 11;
        app.currentYear--;
    }
    
    renderCalendar(calendarId);
}

// Funções do calendário chamadas pelo HTML
function openCalendar(accommodation) {
    const calendarId = accommodation === 'alojamento1' ? 'calendar1' : 'calendar2';
    switchCalendarTab(calendarId);
    
    // Scroll to calendar section
    document.getElementById('calendario').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Sistema de Galeria
function setupGalleries() {
    // Generate gallery images
    generateGalleryImages();
    
    // REMOVIDO: Setup gallery tabs - agora a galeria segue automaticamente o calendário
    // A galeria será controlada pela função syncGalleryWithCalendar()
    
    // Inicializar galeria com o calendário ativo
    const initialGallery = app.currentCalendar === 'calendar1' ? 'gallery1' : 'gallery2';
    syncGalleryWithCalendar(initialGallery);
}

function generateGalleryImages() {
    const gallery1 = document.getElementById('gallery1-grid');
    const gallery2 = document.getElementById('gallery2-grid');
    
    // Generate 30 placeholder images for each accommodation
    for (let i = 1; i <= 30; i++) {
        // Alojamento 1
        const item1 = createGalleryItem(`imagens/alojamento1/${i}.jpg`, `Casa do Vigia - Foto ${i}`, 'alojamento1', i-1);
        gallery1.appendChild(item1);
        app.galleries.alojamento1.push(`imagens/alojamento1/${i}.jpg`);
        
        // Alojamento 2 (Cantinho das Quintãs - imagens já existem)
        const item2 = createGalleryItem(`imagens/alojamento2/${i}.jpg`, `Cantinho das Quintãs - Foto ${i}`, 'alojamento2', i-1);
        gallery2.appendChild(item2);
        app.galleries.alojamento2.push(`imagens/alojamento2/${i}.jpg`);
    }
}

function createGalleryItem(src, alt, gallery, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    
    item.innerHTML = `
        <img src="${src}" alt="${alt}" onerror="this.src='imagens/exemplo.png'">
        <div class="gallery-overlay">
            <i class="fas fa-search-plus"></i>
        </div>
    `;
    
    item.addEventListener('click', () => {
        openGalleryModal(gallery, index);
    });
    
    return item;
}

function switchGalleryTab(target) {
    // Update tabs (se existirem)
    document.querySelectorAll('.gallery-tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    const targetTab = document.querySelector(`[data-target="${target}"]`);
    if (targetTab) targetTab.classList.add('active');
    
    // Update content
    document.querySelectorAll('.gallery-tab').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(target).classList.add('active');
}

// NOVA FUNÇÃO: Sincronizar galeria com calendário (sem tabs visíveis)
function syncGalleryWithCalendar(galleryTarget) {
    // Mudar galeria silenciosamente para corresponder ao calendário
    document.querySelectorAll('.gallery-tab').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(galleryTarget).classList.add('active');
    
    // Atualizar indicador visual da galeria
    const accommodationName = galleryTarget === 'gallery1' ? 'Vigia\'s Guest House' : 'Cantinho das Quintãs';
    const indicator = document.getElementById('gallery-current-accommodation');
    if (indicator) {
        indicator.textContent = accommodationName;
    }
    
    console.log(`🖼️ Galeria sincronizada: ${accommodationName}`);
}

function openGallery(accommodation) {
    // NOVO: Sempre sincronizar com calendário atual
    const currentCalendarId = app.currentCalendar;
    const galleryId = currentCalendarId === 'calendar1' ? 'gallery1' : 'gallery2';
    
    // Se clicaram numa galeria diferente do calendário ativo, mudar calendário também
    if ((accommodation === 'alojamento1' && currentCalendarId !== 'calendar1') ||
        (accommodation === 'alojamento2' && currentCalendarId !== 'calendar2')) {
        const targetCalendar = accommodation === 'alojamento1' ? 'calendar1' : 'calendar2';
        switchCalendarTab(targetCalendar);
    }
    
    syncGalleryWithCalendar(galleryId);
    
    // Scroll to gallery section
    document.getElementById('galeria').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Modal da Galeria
function setupModals() {
    const modal = document.getElementById('gallery-modal');
    const closeBtn = document.querySelector('.close');
    const prevBtn = document.getElementById('modal-prev');
    const nextBtn = document.getElementById('modal-next');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomResetBtn = document.getElementById('zoom-reset');
    const modalImage = document.getElementById('modal-image');
    
    closeBtn?.addEventListener('click', closeGalleryModal);
    prevBtn?.addEventListener('click', () => navigateGallery(-1));
    nextBtn?.addEventListener('click', () => navigateGallery(1));
    
    // Zoom controls
    zoomInBtn?.addEventListener('click', () => zoomImage(1.2));
    zoomOutBtn?.addEventListener('click', () => zoomImage(0.8));
    zoomResetBtn?.addEventListener('click', resetZoom);
    
    // Mouse wheel zoom
    modalImage?.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        zoomImage(zoomFactor);
    });
    
    // Drag functionality
    modalImage?.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeGalleryModal();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (modal?.style.display === 'block') {
            switch(e.key) {
                case 'Escape':
                    closeGalleryModal();
                    break;
                case 'ArrowLeft':
                    navigateGallery(-1);
                    break;
                case 'ArrowRight':
                    navigateGallery(1);
                    break;
                case '+':
                case '=':
                    zoomImage(1.2);
                    break;
                case '-':
                    zoomImage(0.8);
                    break;
                case '0':
                    resetZoom();
                    break;
            }
        }
    });
}

function openGalleryModal(gallery, index) {
    const modal = document.getElementById('gallery-modal');
    const modalImage = document.getElementById('modal-image');
    const modalCounter = document.getElementById('modal-counter');
    
    app.currentGallery = gallery;
    app.currentGalleryIndex = index;
    
    const imageSrc = app.galleries[gallery][index];
    modalImage.src = imageSrc;
    modalImage.onerror = () => modalImage.src = 'imagens/exemplo.png';
    
    // Update counter
    modalCounter.textContent = `${index + 1} / ${app.galleries[gallery].length}`;
    
    // Reset zoom and position
    resetZoom();
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetZoom();
}

function navigateGallery(direction) {
    const gallery = app.galleries[app.currentGallery];
    app.currentGalleryIndex += direction;
    
    if (app.currentGalleryIndex >= gallery.length) {
        app.currentGalleryIndex = 0;
    } else if (app.currentGalleryIndex < 0) {
        app.currentGalleryIndex = gallery.length - 1;
    }
    
    const modalImage = document.getElementById('modal-image');
    const modalCounter = document.getElementById('modal-counter');
    const imageSrc = gallery[app.currentGalleryIndex];
    
    modalImage.src = imageSrc;
    modalImage.onerror = () => modalImage.src = 'imagens/exemplo.png';
    
    // Update counter
    modalCounter.textContent = `${app.currentGalleryIndex + 1} / ${gallery.length}`;
    
    // Reset zoom and position
    resetZoom();
}

// Zoom functions
function zoomImage(factor) {
    app.modalZoomLevel *= factor;
    app.modalZoomLevel = Math.max(0.5, Math.min(3, app.modalZoomLevel)); // Limit zoom between 50% and 300%
    
    const modalImage = document.getElementById('modal-image');
    modalImage.style.transform = `scale(${app.modalZoomLevel}) translate(${app.imagePosition.x}px, ${app.imagePosition.y}px)`;
}

function resetZoom() {
    app.modalZoomLevel = 1;
    app.imagePosition = { x: 0, y: 0 };
    
    const modalImage = document.getElementById('modal-image');
    modalImage.style.transform = 'scale(1) translate(0px, 0px)';
}

// Drag functions
function startDrag(e) {
    if (app.modalZoomLevel > 1) {
        app.isDragging = true;
        app.dragStart = { x: e.clientX - app.imagePosition.x, y: e.clientY - app.imagePosition.y };
        e.preventDefault();
    }
}

function drag(e) {
    if (app.isDragging && app.modalZoomLevel > 1) {
        app.imagePosition.x = e.clientX - app.dragStart.x;
        app.imagePosition.y = e.clientY - app.dragStart.y;
        
        const modalImage = document.getElementById('modal-image');
        modalImage.style.transform = `scale(${app.modalZoomLevel}) translate(${app.imagePosition.x}px, ${app.imagePosition.y}px)`;
        e.preventDefault();
    }
}

function endDrag() {
    app.isDragging = false;
}

// Formulário de Contacto
function setupContactForm() {
    const form = document.getElementById('contact-form');
    
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleContactSubmission();
    });
}

function openContactForm() {
    // Preencher automaticamente o alojamento selecionado
    const accommodationSelect = document.getElementById('accommodation');
    const currentAccommodation = app.currentCalendar === 'calendar1' ? 'alojamento1' : 'alojamento2';
    
    if (accommodationSelect) {
        accommodationSelect.value = currentAccommodation;
    }
    
    // Scroll to contact section
    document.getElementById('contacto').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

async function handleContactSubmission() {
    const formData = new FormData(document.getElementById('contact-form'));
    const data = Object.fromEntries(formData);
    
    // Validação simples
    if (!data.name || !data.email || !data.accommodation) {
        alert('Por favor, preencha todos os campos obrigatórios (Nome, E-mail e Alojamento).');
        return;
    }
    
    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        alert('Por favor, introduza um email válido.');
        return;
    }
    
    // Desabilitar botão durante envio
    const submitButton = document.querySelector('#contact-form button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'A enviar...';
    
    try {
        // Verificar se EmailJS está disponível
        if (typeof emailjs === 'undefined') {
            throw new Error('EmailJS não está disponível');
        }
        
        // Preparar dados para EmailJS
        const templateParams = {
            from_name: data.name,
            from_email: data.email,
            phone: data.phone || 'Não fornecido',
            accommodation: getAccommodationName(data.accommodation),
            dates: data.dates || 'Não especificadas',
            message: data.message || 'Sem mensagem adicional',
            to_email: 'antoniojclourenco@gmail.com'
        };
        
        console.log('📤 A enviar e-mail via EmailJS...', templateParams);
        
        // Enviar email através do EmailJS
        const response = await emailjs.send(
            app.emailjs.serviceId,
            app.emailjs.templateId,
            templateParams
        );
        
        console.log('✅ E-mail enviado com sucesso:', response);
        
        // Mostrar mensagem de sucesso
        alert('✅ Pedido enviado com sucesso!\n\nReceberá uma resposta em breve no e-mail fornecido.\n\nObrigado pela sua preferência!');
        
        // Reset form após sucesso
        document.getElementById('contact-form').reset();
        app.selectedDates = [];
        updateSelectedDatesDisplay();
        
        // ATUALIZAR CALENDÁRIO após pedido de reserva (pode haver novas reservas)
        console.log('🔄 APÓS RESERVA: A verificar atualizações no calendário...');
        setTimeout(() => {
            updateBookingData();
        }, 2000); // Aguardar 2 segundos antes de atualizar
        
    } catch (error) {
        console.error('❌ Erro ao enviar via EmailJS:', error);
        
        // Fallback para sistema mailto
        console.log('📧 Usando fallback mailto...');
        
        const emailBody = `Pedido de Reserva - V&Q Alojamentos Locais

DADOS DO CLIENTE:
Nome: ${data.name}
Email: ${data.email}
Telefone: ${data.phone || 'Não fornecido'}

DETALHES DA RESERVA:
Alojamento: ${getAccommodationName(data.accommodation)}
Datas Pretendidas: ${data.dates || 'Não especificadas'}

MENSAGEM:
${data.message || 'Sem mensagem adicional'}

---
Este pedido foi enviado através do website V&Q Alojamentos Locais.
`;
        
        try {
            // Criar link mailto
            const subject = `Pedido de Reserva - ${getAccommodationName(data.accommodation)}`;
            const mailtoLink = `mailto:antoniojclourenco@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
            
            // Verificar se o link não é muito longo
            if (mailtoLink.length > 2000) {
                alert('Mensagem muito longa. Por favor, reduza o texto e tente novamente.');
                return;
            }
            
            // Abrir cliente de email
            window.location.href = mailtoLink;
            
            // Mostrar confirmação
            setTimeout(() => {
                alert('✅ Pedido enviado!\n\nO seu cliente de email foi aberto com todos os dados pré-preenchidos.\n\nSe não abriu automaticamente, pode contactar-nos diretamente em:\nantoniojclourenco@gmail.com\n+351 962 696 564');
            }, 500);
            
            // Reset form após confirmação
            setTimeout(() => {
                document.getElementById('contact-form').reset();
                app.selectedDates = [];
                updateSelectedDatesDisplay();
            }, 1000);
            
        } catch (mailtoError) {
            console.error('Erro ao abrir cliente de e-mail:', mailtoError);
            alert('❌ Erro ao processar pedido.\n\nPor favor, contacte-nos diretamente:\n📧 antoniojclourenco@gmail.com\n📞 +351 962 696 564');
        }
        
    } finally {
        // Reativar botão
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

function getAccommodationName(value) {
    switch(value) {
        case 'alojamento1': return 'Casa do Vigia';
        case 'alojamento2': return 'Cantinho das Quintãs';
        case 'ambos': return 'Ambos os Alojamentos';
        default: return 'Não especificado';
    }
}

// Efeitos de Scroll
function setupScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observar elementos que devem ter animação
    document.querySelectorAll('.accommodation-card, .contact-item, .gallery-item').forEach(el => {
        observer.observe(el);
    });
}

// Funções utilitárias
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('pt-PT');
}

function isDateOccupied(date, accommodation) {
    return app.bookingData[accommodation].occupiedDates.includes(date);
}

// Simulação de atualização de dados do Booking via iCal
async function updateBookingData() {
    console.log('🔄 A carregar dados do Booking.com...');
    try {
        // Para cada alojamento, buscar dados do iCal
        for (const [accommodation, icalUrl] of Object.entries(app.icalUrls)) {
            console.log(`📅 A verificar ${accommodation}:`, icalUrl);
            
            if (icalUrl && !icalUrl.includes('...')) {
                console.log(`✅ URL válido encontrado para ${accommodation}`);
                console.log(`🌐 A tentar carregar dados reais do iCal...`);
                
                const occupiedDates = await fetchICalData(icalUrl);
                
                if (occupiedDates.length > 0) {
                    // SUBSTITUIR os dados vazios pelos reais
                    app.bookingData[accommodation].occupiedDates = occupiedDates;
                    console.log(`✅ ${occupiedDates.length} datas reais carregadas para ${accommodation}`);
                    console.log(`🎯 DADOS REAIS DO BOOKING.COM aplicados para ${accommodation}`);
                } else {
                    console.log(`⚠️ Nenhuma data ocupada encontrada para ${accommodation}`);
                }
            } else {
                console.log(`❌ URL não configurado para ${accommodation}`);
            }
        }
        
        console.log('✅ Dados do iCal atualizados');
        console.log('📊 Estado final dos dados:', app.bookingData);
        console.log('🔍 Verificação final - alojamento1:', app.bookingData.alojamento1.occupiedDates.length, 'datas');
        console.log('🔍 Verificação final - alojamento2:', app.bookingData.alojamento2.occupiedDates.length, 'datas');
        
        // Re-render calendars with new data
        renderCalendar('calendar1');
        renderCalendar('calendar2');
        
        // Log final de confirmação
        setTimeout(() => {
            console.log('🎯 CALENDÁRIOS RENDERIZADOS!');
            console.log('📅 Calendar1 (Vigia):', app.bookingData.alojamento1.occupiedDates.slice(0, 5), '...');
            console.log('📅 Calendar2 (Cantinho):', app.bookingData.alojamento2.occupiedDates.slice(0, 5), '...');
        }, 500);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar dados do iCal:', error);
        
        // Re-render calendars mesmo com erro
        renderCalendar('calendar1');
        renderCalendar('calendar2');
    }
}

// Função para carregar ficheiro iCal LOCAL - MUITO MAIS SIMPLES E CONFIÁVEL
async function fetchICalData(icalUrl) {
    console.log('🌐 A carregar dados iCal do Booking.com:', icalUrl);
    
    // Lista de proxies CORS otimizados para GitHub Pages
    const corsProxies = [
        'https://api.allorigins.win/raw?url=',  // Mais estável para GitHub Pages
        'https://corsproxy.io/?',               // Backup
        'https://cors-anywhere.herokuapp.com/' // Último recurso
    ];
    
    // Extrair URL original do Booking.com
    let originalUrl;
    if (icalUrl.includes('cors-anywhere.herokuapp.com/')) {
        originalUrl = icalUrl.split('cors-anywhere.herokuapp.com/')[1];
    } else if (icalUrl.includes('raw?url=')) {
        originalUrl = icalUrl.split('raw?url=')[1];
    } else if (icalUrl.includes('corsproxy.io/?')) {
        originalUrl = icalUrl.split('corsproxy.io/?')[1];
    } else {
        originalUrl = icalUrl;
    }
    
    console.log('🔗 URL original extraído:', originalUrl);
    console.log('🔍 URL contém booking.com?', originalUrl.includes('booking.com'));
    console.log('🔍 URL contém token?', originalUrl.includes('?t='));
    
    for (let i = 0; i < corsProxies.length; i++) {
        try {
            const proxyUrl = corsProxies[i] + originalUrl;
            console.log(`🔄 Tentativa ${i + 1}/${corsProxies.length}: ${proxyUrl}`);
            
            const startTime = Date.now();
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const duration = Date.now() - startTime;
            
            console.log(`📡 Resposta recebida em ${duration}ms - Status: ${response.status} ${response.statusText}`);
            console.log(`📡 Content-Type:`, response.headers.get('content-type'));
            console.log(`📡 Content-Length:`, response.headers.get('content-length'));
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const icalText = await response.text();
            console.log('✅ Dados iCal carregados com sucesso!');
            console.log(`📊 Tamanho da resposta: ${icalText.length} caracteres`);
            console.log('📊 Conteúdo (primeiros 300 chars):', icalText.substring(0, 300));
            console.log('📊 Conteúdo (últimos 100 chars):', icalText.substring(icalText.length - 100));
            
            if (icalText.includes('BEGIN:VCALENDAR')) {
                const eventCount = (icalText.match(/BEGIN:VEVENT/g) || []).length;
                console.log(`📋 Encontrados ${eventCount} eventos no iCal`);
                
                const events = parseICalEvents(icalText);
                console.log('🎯 RESERVAS REAIS CARREGADAS:', events);
                console.log(`🎯 Total de datas ocupadas processadas: ${events.length}`);
                
                if (events.length > 0) {
                    console.log(`🎯 Primeira data ocupada: ${events[0]}`);
                    console.log(`🎯 Última data ocupada: ${events[events.length - 1]}`);
                }
                
                return events;
            } else {
                console.warn('⚠️ Resposta não contém BEGIN:VCALENDAR');
                console.log('📄 Conteúdo completo da resposta:', icalText);
                throw new Error('Resposta não é um iCal válido');
            }
            
        } catch (error) {
            console.warn(`❌ Proxy ${i + 1} falhou:`, error.message);
            console.warn('🔍 Detalhes do erro:', error);
            
            // Se é o último proxy, retornar array vazio
            if (i === corsProxies.length - 1) {
                console.error('🚨 Todos os proxies falharam - calendário ficará vazio');
                console.error('💡 Sugestão: Verificar se os URLs do Booking.com estão corretos');
                console.error('💡 URL original testado:', originalUrl);
                return [];
            }
        }
    }
    
    return [];
}

// Parser melhorado para eventos iCal
function parseICalEvents(icalText) {
    console.log('🔍 A processar dados iCal...');
    console.log(`📊 Total de linhas a processar: ${icalText.split('\n').length}`);
    
    const occupiedDates = [];
    const lines = icalText.split('\n');
    let currentEvent = {};
    let eventCount = 0;
    
    for (let line of lines) {
        line = line.trim();
        
        if (line === 'BEGIN:VEVENT') {
            currentEvent = {};
            eventCount++;
        } else if (line === 'END:VEVENT') {
            if (currentEvent.dtstart && currentEvent.dtend) {
                // Datas da reserva (do check-in até checkout, excluindo checkout)
                const reservationDates = getDatesBetween(currentEvent.dtstart, currentEvent.dtend);
                
                occupiedDates.push(...reservationDates);
                
                console.log(`📋 Evento ${eventCount}: CHECK-IN ${currentEvent.dtstart} até CHECKOUT ${currentEvent.dtend}`);
                console.log(`🏠 Dias ocupados desta reserva: ${reservationDates.join(', ')} (${reservationDates.length} dias)`);
                console.log(`ℹ️  Resumo: ${currentEvent.summary || 'Sem título'}`);
                console.log('---');
            } else {
                console.warn(`⚠️ Evento ${eventCount} incompleto:`, currentEvent);
            }
        } else if (line.startsWith('DTSTART')) {
            // Suportar diferentes formatos de data
            const dateMatch = line.match(/(\d{8})/);
            if (dateMatch) {
                const dateStr = dateMatch[1];
                currentEvent.dtstart = `${dateStr.substr(0,4)}-${dateStr.substr(4,2)}-${dateStr.substr(6,2)}`;
            } else {
                console.warn(`⚠️ Formato DTSTART não reconhecido: ${line}`);
            }
        } else if (line.startsWith('DTEND')) {
            const dateMatch = line.match(/(\d{8})/);
            if (dateMatch) {
                const dateStr = dateMatch[1];
                currentEvent.dtend = `${dateStr.substr(0,4)}-${dateStr.substr(4,2)}-${dateStr.substr(6,2)}`;
            } else {
                console.warn(`⚠️ Formato DTEND não reconhecido: ${line}`);
            }
        } else if (line.startsWith('SUMMARY')) {
            // Guardar resumo
            currentEvent.summary = line.split(':')[1] || '';
        }
    }
    
    // Remover duplicatas e ordenar
    const uniqueDates = [...new Set(occupiedDates)].sort();
    console.log(`✅ Total de eventos processados: ${eventCount}`);
    console.log(`📅 Total de dias ocupados: ${uniqueDates.length}`);
    
    if (uniqueDates.length === 0) {
        console.warn('⚠️ NENHUMA DATA OCUPADA ENCONTRADA!');
    }
    
    return uniqueDates;
}

// Converter data iCal (YYYYMMDD) para formato ISO (YYYY-MM-DD)
function parseICalDate(icalDate) {
    const year = icalDate.substring(0, 4);
    const month = icalDate.substring(4, 6);
    const day = icalDate.substring(6, 8);
    return `${year}-${month}-${day}`;
}

// Obter todas as datas entre duas datas
function getDatesBetween(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    // Incluir o dia de início (check-in) e excluir o dia de fim (checkout)
    while (currentDate < end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}

// Atualizar dados do iCal automaticamente a cada 10 minutos (600000 ms)
// Isto garante que novas reservas aparecem automaticamente
setInterval(() => {
    console.log('⏰ ATUALIZAÇÃO AUTOMÁTICA: A verificar novas reservas...');
    updateBookingData();
}, 600000); // 10 minutos

// Também verificar quando a janela ganha foco (user volta ao site)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('👁️ SITE ATIVO: A verificar novas reservas...');
        updateBookingData();
    }
});

// Event listeners globais
window.addEventListener('resize', () => {
    // Re-render calendars on window resize
    renderCalendar(app.currentCalendar);
});

// Smooth scroll para links internos
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Preload de imagens críticas
function preloadImages() {
    const criticalImages = [
        'imagens/exemplo.png',
        'imagens/alojamento1/foto1.jpg',
        'imagens/alojamento2/foto1.jpg'
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Inicializar preload
preloadImages();
