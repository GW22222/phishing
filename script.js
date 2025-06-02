document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const elements = {
        // Modais
        checkoutModal: document.getElementById('checkoutModal'),
        devModal: document.getElementById('devModal'),
        orcamentoModal: document.getElementById('orcamentoModal'),
        cursoModal: document.getElementById('cursoModal'),
        
        // Botões de abertura
        openCheckoutBtn: document.getElementById('openCheckoutBtn'),
        openDevBtn: document.getElementById('openDevBtn'),
        openCursoBtn: document.getElementById('openCursoBtn'),
        openOrcamentoBtns: document.querySelectorAll('[id^="openOrcamentoBtn"]'),
        
        // Botões de fechar
        closeBtns: document.querySelectorAll('.close-btn, .dev-close'),
        
        // Elementos do checkout
        fileOptions: document.querySelectorAll('.file-option'),
        nextBtn: document.getElementById('nextBtn'),
        pixAmount: document.getElementById('pixAmount'),
        pixKey: document.getElementById('pixKey'),
        copyPixBtn: document.getElementById('copyPixBtn'),
        paymentStatus: document.getElementById('paymentStatus'),
        downloadBtn: document.getElementById('downloadBtn'),
        waitingPayment: document.getElementById('waitingPayment'),
        
        // Elementos do curso
        cursoNextBtn: document.getElementById('cursoNextBtn'),
        copyCursoPixBtn: document.getElementById('copyCursoPixBtn'),
        cursoPaymentStatus: document.getElementById('cursoPaymentStatus'),
        cursoDownloadBtn: document.getElementById('cursoDownloadBtn'),
        cursoWaitingPayment: document.getElementById('cursoWaitingPayment'),
        
        // Formulário de orçamento
        orcamentoForm: document.getElementById('orcamentoForm'),
        orcamentoSuccess: document.getElementById('orcamentoSuccess'),
        
        // Botão do WhatsApp
        whatsappBtn: document.querySelector('.whatsapp-btn')
    };

    // Estado da aplicação
    const state = {
        selectedFile: null,
        currentPedidoId: null,
        currentCursoPedidoId: null
    };

    // Preços dos produtos
    const prices = {
        site_bancario: 299.90,
        rede_social: 349.90,
        curso: 499.90
    };

    // Inicialização
    function init() {
        setupEventListeners();
    }

    // Configura todos os event listeners
    function setupEventListeners() {
        // Abrir modais
        elements.openCheckoutBtn.addEventListener('click', () => showModal(elements.checkoutModal));
        elements.openDevBtn.addEventListener('click', () => showModal(elements.devModal));
        elements.openCursoBtn.addEventListener('click', () => showModal(elements.cursoModal));
        
        elements.openOrcamentoBtns.forEach(btn => {
            btn.addEventListener('click', () => showModal(elements.orcamentoModal));
        });

        // Fechar modais
        elements.closeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.checkout-modal, .dev-modal');
                hideModal(modal);
            });
        });

        // Fechar ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('checkout-modal') || 
                e.target.classList.contains('dev-modal')) {
                hideModal(e.target);
            }
        });

        // Seleção de arquivo
        elements.fileOptions.forEach(option => {
            option.addEventListener('click', function() {
                selectFileOption(this);
            });
        });

        // Próximo passo no checkout
        elements.nextBtn.addEventListener('click', proceedToPayment);

        // Copiar chave PIX
        elements.copyPixBtn.addEventListener('click', copyPixKey);

        // Próximo passo no curso
        elements.cursoNextBtn.addEventListener('click', proceedToCursoPayment);

        // Copiar chave PIX do curso
        elements.copyCursoPixBtn.addEventListener('click', copyCursoPixKey);

        // Enviar formulário de orçamento
        elements.orcamentoForm.addEventListener('submit', submitOrcamentoForm);

        // Efeito expandir nas imagens
        document.querySelectorAll('.expandable-image').forEach(img => {
            img.addEventListener('click', toggleImageScale);
        });
    }

    // Mostrar modal
    function showModal(modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Resetar estado se for o modal de checkout
        if (modal === elements.checkoutModal) {
            resetCheckoutModal();
        }
        
        // Resetar estado se for o modal de curso
        if (modal === elements.cursoModal) {
            resetCursoModal();
        }
    }

    // Esconder modal
    function hideModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Resetar modal de checkout
    function resetCheckoutModal() {
        elements.step1.classList.add('active');
        elements.step2.classList.remove('active');
        elements.paymentStatus.classList.add('hidden');
        elements.waitingPayment.classList.add('hidden');
        elements.nextBtn.disabled = true;
        
        elements.fileOptions.forEach(option => {
            option.classList.remove('selected');
            option.querySelector('input').checked = false;
        });
        
        state.selectedFile = null;
    }

    // Resetar modal de curso
    function resetCursoModal() {
        elements.cursoStep1.classList.add('active');
        elements.cursoStep2.classList.remove('active');
        elements.cursoPaymentStatus.classList.add('hidden');
        elements.cursoWaitingPayment.classList.add('hidden');
    }

    // Selecionar opção de arquivo
    function selectFileOption(option) {
        elements.fileOptions.forEach(opt => {
            opt.classList.remove('selected');
            opt.querySelector('input').checked = false;
        });
        
        option.classList.add('selected');
        const radio = option.querySelector('input');
        radio.checked = true;
        elements.nextBtn.disabled = false;
        
        // Atualizar estado e valor do PIX
        state.selectedFile = radio.value;
        elements.pixAmount.textContent = `R$ ${prices[radio.value].toFixed(2)}`;
    }

    // Proceder para pagamento
    async function proceedToPayment() {
        if (!state.selectedFile) return;
        
        try {
            // Mostrar loading
            elements.step1.classList.remove('active');
            elements.step2.classList.add('active');
            elements.waitingPayment.classList.remove('hidden');
            
            // Chamar API para gerar PIX
            const response = await gerarPix(prices[state.selectedFile], 'template');
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            // Atualizar QR Code e informações
            document.querySelector('#step2 .pix-code img').src = response.qrCode;
            elements.pixKey.textContent = response.pixCode;
            state.currentPedidoId = response.pedidoId;
            
            // Verificar pagamento periodicamente
            const interval = setInterval(async () => {
                const status = await verificarPagamento(state.currentPedidoId);
                
                if (status.status === 'pago') {
                    clearInterval(interval);
                    paymentConfirmed();
                }
            }, 5000);
            
        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
            alert('Erro ao processar pagamento. Por favor, tente novamente.');
            resetCheckoutModal();
        }
    }

    // Pagamento confirmado
    function paymentConfirmed() {
        elements.waitingPayment.classList.add('hidden');
        elements.paymentStatus.classList.remove('hidden');
        
        // Configurar link de download
        elements.downloadBtn.href = `/download?file=${state.selectedFile}&token=${generateToken()}`;
    }

    // Proceder para pagamento do curso
    async function proceedToCursoPayment() {
        try {
            // Mostrar loading
            elements.cursoStep1.classList.remove('active');
            elements.cursoStep2.classList.add('active');
            elements.cursoWaitingPayment.classList.remove('hidden');
            
            // Chamar API para gerar PIX
            const response = await gerarPix(prices.curso, 'curso');
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            // Atualizar QR Code e informações
            document.querySelector('#cursoStep2 .pix-code img').src = response.qrCode;
            document.querySelector('#cursoStep2 .text-yellow-400').textContent = response.pixCode;
            state.currentCursoPedidoId = response.pedidoId;
            
            // Verificar pagamento periodicamente
            const interval = setInterval(async () => {
                const status = await verificarPagamento(state.currentCursoPedidoId);
                
                if (status.status === 'pago') {
                    clearInterval(interval);
                    cursoPaymentConfirmed(status.tokenAcesso);
                }
            }, 5000);
            
        } catch (error) {
            console.error('Erro ao processar pagamento do curso:', error);
            alert('Erro ao processar pagamento. Por favor, tente novamente.');
            resetCursoModal();
        }
    }

    // Pagamento do curso confirmado
    function cursoPaymentConfirmed(tokenAcesso) {
        elements.cursoWaitingPayment.classList.add('hidden');
        elements.cursoPaymentStatus.classList.remove('hidden');
        
        // Configurar link para o Telegram (substitua pela URL real do seu grupo)
        const telegramLink = "https://t.me/seugrupodotelegram";
        elements.cursoDownloadBtn.href = telegramLink;
        
        // Opcional: abrir automaticamente o link do Telegram
        window.open(telegramLink, '_blank');
    }

    // Copiar chave PIX
    function copyPixKey() {
        navigator.clipboard.writeText(elements.pixKey.textContent)
            .then(() => {
                elements.copyPixBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Copiado!';
                setTimeout(() => {
                    elements.copyPixBtn.innerHTML = '<i class="fas fa-copy mr-1"></i> Copiar chave';
                }, 2000);
            })
            .catch(err => {
                console.error('Erro ao copiar chave PIX:', err);
            });
    }

    // Copiar chave PIX do curso
    function copyCursoPixKey() {
        const pixKey = document.querySelector('#cursoStep2 .text-yellow-400').textContent;
        navigator.clipboard.writeText(pixKey)
            .then(() => {
                elements.copyCursoPixBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Copiado!';
                setTimeout(() => {
                    elements.copyCursoPixBtn.innerHTML = '<i class="fas fa-copy mr-1"></i> Copiar chave';
                }, 2000);
            })
            .catch(err => {
                console.error('Erro ao copiar chave PIX:', err);
            });
    }

    // Enviar formulário de orçamento
    async function submitOrcamentoForm(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const whatsapp = document.getElementById('whatsapp').value;
        const descricao = document.getElementById('descricao').value;
        
        if (!email || !whatsapp || !descricao) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        
        try {
            // Mostrar loading (opcional)
            
            // Enviar para o backend
            const response = await enviarOrcamento(email, whatsapp, descricao);
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            // Mostrar mensagem de sucesso
            elements.orcamentoForm.classList.add('hidden');
            elements.orcamentoSuccess.classList.remove('hidden');
            
            // Resetar após 3 segundos
            setTimeout(() => {
                elements.orcamentoForm.reset();
                elements.orcamentoForm.classList.remove('hidden');
                elements.orcamentoSuccess.classList.add('hidden');
                hideModal(elements.orcamentoModal);
            }, 3000);
            
        } catch (error) {
            console.error('Erro ao enviar orçamento:', error);
            alert('Erro ao enviar solicitação. Por favor, tente novamente.');
        }
    }

    // Alternar escala da imagem
    function toggleImageScale() {
        if (this.style.transform === 'scale(1.05)') {
            this.style.transform = 'scale(1)';
        } else {
            this.style.transform = 'scale(1.05)';
        }
    }

    // Funções de API
    async function gerarPix(valor, tipo) {
        const response = await fetch('/api/gerar-pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor, tipo })
        });
        return await response.json();
    }

    async function verificarPagamento(pedidoId) {
        const response = await fetch(`/api/verificar-pagamento/${pedidoId}`);
        return await response.json();
    }

    async function enviarOrcamento(email, whatsapp, descricao) {
        const response = await fetch('/api/solicitar-orcamento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, whatsapp, descricao })
        });
        return await response.json();
    }

    // Gerar token fictício
    function generateToken() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Inicializar a aplicação
    init();
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   