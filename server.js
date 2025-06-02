require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const QRCode = require('qrcode');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configurações do PIX
const PIX_CONFIG = {
    chave: process.env.PIX_KEY || '123e4567-e12b-12d1-a456-426655440000',
    nome: 'Security Dev',
    cidade: 'São Paulo',
    txId: () => `TESTE${Math.random().toString(36).substring(2, 15)}`
};

// Banco de dados em memória (substitua por um banco real em produção)
const db = {
    pedidos: {},
    cursos: {}
};

// Gerar QR Code PIX
app.post('/api/gerar-pix', async (req, res) => {
    try {
        const { valor, tipo } = req.body;
        
        if (!valor || isNaN(valor)) {
            return res.status(400).json({ error: 'Valor inválido' });
        }

        const payload = {
            chave: PIX_CONFIG.chave,
            valor: parseFloat(valor).toFixed(2),
            nome: PIX_CONFIG.nome,
            cidade: PIX_CONFIG.cidade,
            txid: PIX_CONFIG.txId()
        };

        // Gerar QR Code
        const qrCode = await QRCode.toDataURL(`pix://${PIX_CONFIG.chave}?amount=${payload.valor}`);

        // Salvar pedido no "banco de dados"
        const pedidoId = Date.now().toString();
        db.pedidos[pedidoId] = {
            ...payload,
            status: 'pendente',
            tipo,
            data: new Date()
        };

        res.json({
            qrCode,
            pixCode: PIX_CONFIG.chave,
            valor: payload.valor,
            pedidoId
        });

    } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        res.status(500).json({ error: 'Erro ao processar pagamento' });
    }
});

// Verificar status do pagamento
app.get('/api/verificar-pagamento/:pedidoId', (req, res) => {
    try {
        const { pedidoId } = req.params;
        const pedido = db.pedidos[pedidoId];

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        // Simulação: após 30 segundos, marca como pago (em produção, integre com API de pagamentos)
        const agora = new Date();
        const diferenca = (agora - new Date(pedido.data)) / 1000;
        
        if (diferenca > 30 && pedido.status === 'pendente') {
            pedido.status = 'pago';
            
            // Se for curso, gerar token de acesso
            if (pedido.tipo === 'curso') {
                const token = gerarTokenAcesso();
                db.cursos[token] = {
                    email: pedido.email,
                    dataAcesso: new Date(),
                    expiraEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
                };
                pedido.tokenAcesso = token;
            }
        }

        res.json({
            status: pedido.status,
            tokenAcesso: pedido.tokenAcesso,
            tipo: pedido.tipo
        });

    } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        res.status(500).json({ error: 'Erro ao verificar pagamento' });
    }
});

// Enviar solicitação de orçamento
app.post('/api/solicitar-orcamento', (req, res) => {
    try {
        const { email, whatsapp, descricao } = req.body;
        
        if (!email || !whatsapp || !descricao) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        // Aqui você pode adicionar lógica para enviar email, salvar no banco de dados, etc.
        console.log('Novo orçamento solicitado:', { email, whatsapp, descricao });

        // Simular atraso de processamento
        setTimeout(() => {
            res.json({ success: true, message: 'Solicitação recebida com sucesso!' });
        }, 1500);

    } catch (error) {
        console.error('Erro ao processar orçamento:', error);
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
});

function gerarTokenAcesso() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});                                                             