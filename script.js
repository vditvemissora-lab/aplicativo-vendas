let carrinho = {};
let produtoAtual = null;
let qtdModal = 1;
let isAdmin = false;

// Senha de Administrador
const SENHA_ADMIN = "1234";

function solicitarSenhaAdmin() {
    if (isAdmin) {
        if (confirm("Deseja sair do modo administrador?")) {
            isAdmin = false;
            document.body.classList.remove('modo-admin');
            document.querySelector('.btn-admin-cadeado').innerText = '🔒';
            alert("Modo administrador encerrado.");
        }
        return;
    }

    const senhaDigitada = prompt("Digite a senha de administrador:");
    if (senhaDigitada === SENHA_ADMIN) {
        isAdmin = true;
        document.body.classList.add('modo-admin');
        document.querySelector('.btn-admin-cadeado').innerText = '🔓';
        alert("Acesso autorizado! Agora você pode gerenciar a disponibilidade dos produtos.");
    } else if (senhaDigitada !== null) {
        alert("Senha incorreta!");
    }
}

function alternarDisponibilidade(botao) {
    if (!isAdmin) return;
    const card = botao.closest('.card-produto-item');
    const disponivel = card.getAttribute('data-disponivel') === 'true';
    const statusTexto = card.querySelector('.status-texto');
    const btnAdd = card.querySelector('.btn-add-rapido');

    if (disponivel) {
        card.setAttribute('data-disponivel', 'false');
        card.classList.add('indisponivel');
        statusTexto.innerText = 'Esgotado';
        statusTexto.style.color = '#d9534f';
        btnAdd.disabled = true;
        botao.innerText = 'Disponibilizar';
    } else {
        card.setAttribute('data-disponivel', 'true');
        card.classList.remove('indisponivel');
        statusTexto.innerText = 'Disponível';
        statusTexto.style.color = '#2e4d30';
        btnAdd.disabled = false;
        botao.innerText = 'Indisponibilizar';
    }
}

function abrirDetalhes(botao) {
    const card = botao.closest('.card-produto-item');
    const disponivel = card.getAttribute('data-disponivel') === 'true';

    produtoAtual = {
        nome: card.getAttribute('data-nome'),
        preco: parseFloat(card.getAttribute('data-preco')),
        desc: card.getAttribute('data-desc'),
        img: card.getAttribute('data-img'),
        disponivel: disponivel
    };

    document.getElementById('modal-icone').innerText = produtoAtual.img;
    document.getElementById('modal-titulo').innerText = produtoAtual.nome;
    document.getElementById('modal-preco').innerText = `R$ ${produtoAtual.preco.toFixed(2).replace('.', ',')}`;
    document.getElementById('modal-descricao').innerText = produtoAtual.desc;
    
    const btnModalAdd = document.getElementById('btn-modal-add');
    if (!disponivel) {
        btnModalAdd.innerText = 'Produto Esgotado';
        btnModalAdd.style.backgroundColor = '#ccc';
        btnModalAdd.disabled = true;
    } else {
        btnModalAdd.innerText = 'Adicionar ao Carrinho';
        btnModalAdd.style.backgroundColor = '#25d366';
        btnModalAdd.disabled = false;
    }

    qtdModal = 1;
    document.getElementById('modal-qtd').innerText = qtdModal;
    document.getElementById('modal-detalhes').style.display = 'flex';
}

function fecharDetalhes() {
    document.getElementById('modal-detalhes').style.display = 'none';
}

function alterarQtdModal(valor) {
    qtdModal += valor;
    if (qtdModal < 1) qtdModal = 1;
    document.getElementById('modal-qtd').innerText = qtdModal;
}

function adicionarDireto(botao) {
    const card = botao.closest('.card-produto-item');
    if (card.getAttribute('data-disponivel') !== 'true') return;

    const nome = card.getAttribute('data-nome');
    const preco = parseFloat(card.getAttribute('data-preco'));
    
    adicionarAoCarrinho(nome, preco, 1);
}

function adicionarDoModalAoCarrinho() {
    if (produtoAtual && produtoAtual.disponivel) {
        adicionarAoCarrinho(produtoAtual.nome, produtoAtual.preco, qtdModal);
        fecharDetalhes();
    }
}

function adicionarAoCarrinho(nome, preco, qtd) {
    if (carrinho[nome]) {
        carrinho[nome].qtd += qtd;
    } else {
        carrinho[nome] = { preco: preco, qtd: qtd };
    }
    atualizarCarrinhoVisual();
}

function alterarQtdCarrinho(nome, valor) {
    carrinho[nome].qtd += valor;
    if (carrinho[nome].qtd <= 0) {
        delete carrinho[nome];
    }
    atualizarCarrinhoVisual();
}

function atualizarCarrinhoVisual() {
    const lista = document.getElementById('lista-carrinho-itens');
    const avisoVazio = document.getElementById('lista-carrinho-vazia');
    const containerTotal = document.getElementById('container-total');
    const containerCliente = document.getElementById('container-cliente');
    const btnWhatsapp = document.getElementById('btn-enviar-whatsapp');
    
    lista.innerHTML = '';
    let total = 0;
    let temItens = false;

    for (let nome in carrinho) {
        temItens = true;
        const item = carrinho[nome];
        const subtotal = item.preco * item.qtd;
        total += subtotal;

        const li = document.createElement('li');
        li.className = 'carrinho-item-linha';
        li.innerHTML = `
            <span>${nome} (R$ ${item.preco.toFixed(2).replace('.', ',')})</span>
            <div class="seletor-qtd">
                <button type="button" onclick="alterarQtdCarrinho('${nome}', -1)">-</button>
                <span>${item.qtd}</span>
                <button type="button" onclick="alterarQtdCarrinho('${nome}', 1)">+</button>
            </div>
        `;
        lista.appendChild(li);
    }

    if (temItens) {
        avisoVazio.style.display = 'none';
        containerTotal.style.display = 'flex';
        containerCliente.style.display = 'flex';
        btnWhatsapp.style.display = 'block';
        document.getElementById('valor-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    } else {
        avisoVazio.style.display = 'block';
        containerTotal.style.display = 'none';
        containerCliente.style.display = 'none';
        btnWhatsapp.style.display = 'none';
    }
}

function enviarPedidoWhatsApp() {
    const nomeCliente = document.getElementById('input-nome').value.trim();

    let mensagem = "Olá! Gostaria de fazer o seguinte pedido dos Produtos Vargem do Itacolomi:\n\n";
    
    if (nomeCliente) {
        mensagem += `*Cliente:* ${nomeCliente}\n\n`;
    }

    mensagem += `*Itens do Pedido:*\n`;
    let totalGeral = 0;

    for (let nome in carrinho) {
        const item = carrinho[nome];
        const subtotal = item.preco * item.qtd;
        totalGeral += subtotal;
        mensagem += `• ${item.qtd}x ${nome} - R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    }

    mensagem += `\n*Total Estimado: R$ ${totalGeral.toFixed(2).replace('.', ',')}*\n\nComo procedemos com a entrega e pagamento?`;

    const numeroWhatsApp = "5531982477418";
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}
