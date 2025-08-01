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
    // URLs dos ficheiros iCal locais - DADOS REAIS DOS DOIS ALOJAMENTOS
    icalUrls: {
        alojamento1: './export.ics',    // 5º Vigia - Ficheiro real do Booking.com
        alojamento2: './exportcq.ics'   // Cantinho das Quintas - Ficheiro real do Booking.com
    },
    // Dados do Booking - SERÃO CARREGADOS DO iCAL
    bookingData: {
        alojamento1: {
            // Iniciar VAZIO - será preenchido pelo iCal
            occupiedDates: []
        },
        alojamento2: {
            // Iniciar VAZIO - será preenchido pelo iCal  
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
    
    // PRIMEIRO: Carregar dados reais do iCal
    console.log('🚀 PRIORIDADE: A carregar dados reais do iCal ANTES de mostrar calendários...');
    await updateBookingData();
    
    // DEPOIS: Inicializar calendários com dados reais
    console.log('� A renderizar calendários com dados reais...');
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
        
        const dateString = currentDate.toISOString().split('T')[0];
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
}

function selectDate(dateString, element) {
    // Verificar se a data está ocupada
    if (element.classList.contains('occupied')) {
        alert('❌ Esta data já está ocupada e não pode ser selecionada.');
        return;
    }
    
    const index = app.selectedDates.indexOf(dateString);
    
    if (index > -1) {
        // Deselect date
        app.selectedDates.splice(index, 1);
        element.classList.remove('selected');
    } else {
        // Verificar se a nova seleção cria um período válido
        const newSelection = [...app.selectedDates, dateString].sort();
        
        if (!isDateRangeValid(newSelection)) {
            alert('❌ Não é possível selecionar este período porque há datas ocupadas no meio.\n\nPor favor, escolha um período sem datas ocupadas.');
            return;
        }
        
        // Select date
        app.selectedDates.push(dateString);
        element.classList.add('selected');
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

function updateSelectedDatesDisplay() {
    const display = document.getElementById('selected-dates-display');
    const contactBtn = document.getElementById('contact-booking');
    
    if (app.selectedDates.length === 0) {
        display.textContent = 'Seleccione as datas desejadas no calendário';
        contactBtn.disabled = true;
    } else {
        const formattedDates = app.selectedDates.map(date => {
            const d = new Date(date + 'T00:00:00');
            return d.toLocaleDateString('pt-PT');
        });
        
        if (formattedDates.length === 1) {
            display.textContent = `Data selecionada: ${formattedDates[0]}`;
        } else {
            display.textContent = `Datas selecionadas: ${formattedDates.join(', ')}`;
        }
        
        contactBtn.disabled = false;
        
        // Update contact form with selected dates
        const datesInput = document.getElementById('dates');
        if (datesInput) {
            if (formattedDates.length === 2) {
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
    
    // Setup gallery tabs
    const galleryTabs = document.querySelectorAll('.gallery-tab-btn');
    galleryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.target;
            switchGalleryTab(target);
        });
    });
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
    // Update tabs
    document.querySelectorAll('.gallery-tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-target="${target}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.gallery-tab').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(target).classList.add('active');
}

function openGallery(accommodation) {
    const galleryId = accommodation === 'alojamento1' ? 'gallery1' : 'gallery2';
    switchGalleryTab(galleryId);
    
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
        
        const emailBody = `Pedido de Reserva - 5º Vigia

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
Este pedido foi enviado através do website 5º Vigia.
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

// Funções utilitárias e debug
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('pt-PT');
}

function isDateOccupied(date, accommodation) {
    return app.bookingData[accommodation].occupiedDates.includes(date);
}

// Função de teste para o sistema de email (remover em produção)
function testEmailSystem() {
    console.log('🧪 Testando sistema de email...');
    const testData = {
        name: 'Teste Usuario',
        email: 'teste@email.com',
        phone: '123456789',
        accommodation: 'alojamento1',
        dates: '15/01/2025 - 18/01/2025',
        message: 'Esta é uma mensagem de teste.'
    };
    
    const emailBody = `Pedido de Reserva - 5º Vigia

DADOS DO CLIENTE:
Nome: ${testData.name}
Email: ${testData.email}
Telefone: ${testData.phone}

DETALHES DA RESERVA:
Alojamento: ${getAccommodationName(testData.accommodation)}
Datas Pretendidas: ${testData.dates}

MENSAGEM:
${testData.message}
`;
    
    console.log('📧 Corpo do email gerado:');
    console.log(emailBody);
    console.log('✅ Sistema de email funcional!');
}

// Executar teste em modo de desenvolvimento
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
    // Adicionar botão de teste (apenas em desenvolvimento)
    setTimeout(() => {
        if (document.getElementById('contact-form')) {
            testEmailSystem();
        }
    }, 2000);
}

// Simulação de atualização de dados do Booking via iCal
async function updateBookingData() {
    console.log('🔄 MODO REAL: A carregar dados do Booking.com...');
    
    // Esta função carrega os dados do iCal do Booking.com
    try {
        // Para cada alojamento, buscar dados do iCal
        for (const [accommodation, icalUrl] of Object.entries(app.icalUrls)) {
            console.log(`📅 A verificar ${accommodation}:`, icalUrl);
            
            if (icalUrl && !icalUrl.includes('...')) { // Verificar se URL foi configurado
                console.log(`✅ URL válido encontrado para ${accommodation}`);
                console.log(`🌐 A tentar carregar dados reais do iCal...`);
                
                const occupiedDates = await fetchICalData(icalUrl);
                
                if (occupiedDates.length > 0) {
                    // SUBSTITUIR os dados simulados pelos reais
                    app.bookingData[accommodation].occupiedDates = occupiedDates;
                    console.log(`✅ ${occupiedDates.length} datas reais carregadas para ${accommodation}:`, occupiedDates);
                } else {
                    console.log(`⚠️ Nenhuma data ocupada encontrada para ${accommodation}`);
                }
            } else {
                console.log(`❌ URL não configurado para ${accommodation}`);
            }
        }
        
        console.log('✅ Dados do iCal atualizados (MODO REAL)');
        console.log('📊 Estado final dos dados:', app.bookingData);
        
        // Re-render calendars with new data
        renderCalendar('calendar1');
        renderCalendar('calendar2');
        
    } catch (error) {
        console.error('❌ Erro ao atualizar dados do iCal:', error);
        console.log('🔄 A manter dados simulados como fallback');
    }
}

// Função para carregar ficheiro iCal LOCAL - MUITO MAIS SIMPLES E CONFIÁVEL
async function fetchICalData(icalFile) {
    console.log('📁 A carregar ficheiro iCal local:', icalFile);
    
    try {
        // Carregar ficheiro local - sem problemas de CORS!
        const response = await fetch(icalFile);
        
        if (!response.ok) {
            throw new Error(`Erro ao carregar ficheiro: ${response.status}`);
        }
        
        const icalText = await response.text();
        console.log('✅ Ficheiro iCal carregado com sucesso!');
        console.log('� Conteúdo (primeiros 200 chars):', icalText.substring(0, 200));
        
        if (icalText.includes('BEGIN:VCALENDAR')) {
            const events = parseICalEvents(icalText);
            console.log('🎯 RESERVAS REAIS CARREGADAS:', events);
            return events;
        } else {
            throw new Error('Ficheiro não é um iCal válido');
        }
        
    } catch (error) {
        console.error(`❌ Erro ao carregar ${icalFile}:`, error.message);
        console.log('⚠️ Ficheiro não encontrado ou inacessível - calendário ficará vazio');
        return [];
    }
}

// Parser melhorado para eventos iCal
function parseICalEvents(icalText) {
    console.log('🔍 A processar dados iCal...');
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
                const dates = getDatesBetween(currentEvent.dtstart, currentEvent.dtend);
                occupiedDates.push(...dates);
                console.log(`📋 Evento ${eventCount}: ${currentEvent.dtstart} até ${currentEvent.dtend} (${dates.length} dias)`);
            }
        } else if (line.startsWith('DTSTART')) {
            // Suportar diferentes formatos de data
            const dateMatch = line.match(/(\d{8})/);
            if (dateMatch) {
                const dateStr = dateMatch[1];
                currentEvent.dtstart = `${dateStr.substr(0,4)}-${dateStr.substr(4,2)}-${dateStr.substr(6,2)}`;
            }
        } else if (line.startsWith('DTEND')) {
            const dateMatch = line.match(/(\d{8})/);
            if (dateMatch) {
                const dateStr = dateMatch[1];
                currentEvent.dtend = `${dateStr.substr(0,4)}-${dateStr.substr(4,2)}-${dateStr.substr(6,2)}`;
            }
        } else if (line.startsWith('SUMMARY')) {
            // Guardar resumo para debug
            currentEvent.summary = line.split(':')[1] || '';
        }
    }
    
    // Remover duplicatas e ordenar
    const uniqueDates = [...new Set(occupiedDates)].sort();
    console.log(`✅ Total de eventos processados: ${eventCount}`);
    console.log(`📅 Total de dias ocupados: ${uniqueDates.length}`);
    console.log('📊 Datas ocupadas:', uniqueDates);
    
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
