let carrinho = {}; // Guarda { idProduto: quantidade }
let produtoAtual = null;
let qtdModal = 1;
let isAdmin = false;
let isMinasGerais = true; // Padrão inicial é Minas Gerais
let cepDigitado = "";

// Produtos iniciais com preço para Minas Gerais (precoMG) e Resto do Brasil (precoBR)
const produtosIniciais = [
    { id: 1, nome: "Queijo Fresco", precoMG: 22.00, precoBR: 28.00, desc: "Queijo fresquinho e caseiro, feito de forma artesanal.", img: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200", disponivel: true },
    { id: 2, nome: "Queijo Curado", precoMG: 25.00, precoBR: 32.00, desc: "Queijo artesanal curado, ponto de maturação ideal.", img: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=200", disponivel: true },
    { id: 3, nome: "Mel (500g)", precoMG: 16.00, precoBR: 21.00, desc: "Mel puro e natural, pote com 500 gramas.", img: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=200", disponivel: true },
    { id: 4, nome: "Leite (Pet 2L)", precoMG: 8.00, precoBR: 12.00, desc: "Leite puro de fazenda engarrafado fresco.", img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200", disponivel: true },
    { id: 5, nome: "Ovos Caipira (Pente 30)", precoMG: 30.00, precoBR: 38.00, desc: "Ovos de galinhas criadas soltas no terreiro.", img: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=200", disponivel: true }
];

// Carregar dados salvos e garantir compatibilidade caso existam produtos da versão anterior
let dadosSalvos = JSON.parse(localStorage.getItem('vargem_produtos'));
let listaProdutos = dadosSalvos ? dadosSalvos.map(p => ({
    ...p,
    precoMG: p.precoMG !== undefined ? p.precoMG : (p.preco || 0),
    precoBR: p.precoBR !== undefined ? p.precoBR : (p.preco || 0)
})) : produtosIniciais;

let configSite = JSON.parse(localStorage.getItem('vargem_config')) || {
    nome: "Produtos Vargem do Itacolomi",
    desc: "O verdadeiro sabor da roça levado até você. Escolha seus produtos e envie o pedido direto pelo WhatsApp.",
    senha: "1234"
};

window.onload = function() {
    aplicarConfiguracoes();
    renderizarProdutos();
};

function obterPrecoAtivo(prod) {
    return isMinasGerais ? prod.precoMG : prod.precoBR;
}

function mascaraEVerificarCEP(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 5) {
        valor = valor.substring(0, 5) + '-' + valor.substring(5, 8);
    }
    input.value = valor;
    cepDigitado = valor;

    const apenasNumeros = valor.replace(/\D/g, '');
    const badge = document.getElementById('badge-regiao');

    // CEPs de Minas Gerais começam obrigatoriamente com o dígito 3 (30000-000 a 39999-999)
    if (apenasNumeros.length === 0) {
        isMinasGerais = true;
        badge.innerText = "Tabela: Minas Gerais";
        badge.className = "badge-regiao regiao-mg";
    } else if (apenasNumeros.startsWith('3')) {
        isMinasGerais = true;
        badge.innerText = "✓ Minas Gerais (Preço Local)";
        badge.className = "badge-regiao regiao-mg";
    } else {
        isMinasGerais = false;
        badge.innerText = "📦 Resto do Brasil";
        badge.className = "badge-regiao regiao-br";
    }

    renderizarProdutos();
    atualizarCarrinhoVisual();
}

function aplicarConfiguracoes() {
    document.getElementById('topo-titulo').innerText = configSite.nome;
    document.getElementById('titulo-pagina-seo').innerText = configSite.nome;
    document.getElementById('topo-descricao').innerText = configSite.desc;
}

function renderizarProdutos() {
    const grid = document.getElementById('grid-produtos');
    grid.innerHTML = '';

    listaProdutos.forEach(prod => {
        const precoExibido = obterPrecoAtivo(prod);
        const div = document.createElement('div');
        div.className = 'card-produto-item';
        if (!prod.disponivel) div.classList.add('indisponivel');

        div.innerHTML = `
            <img src="${prod.img}" alt="${prod.nome}" class="prod-foto" onerror="this.src='https://via.placeholder.com/65?text=Foto'">
            <div class="prod-info-rapida">
                <h3>${prod.nome}</h3>
                <span class="preco">R$ ${precoExibido.toFixed(2).replace('.', ',')}</span>
                <span class="preco-admin-sub admin-only">MG: R$ ${prod.precoMG.toFixed(2).replace('.', ',')} | BR: R$ ${prod.precoBR.toFixed(2).replace('.', ',')}</span>
                <span class="status-texto" style="color: ${prod.disponivel ? '#2e4d30' : '#d9534f'}">${prod.disponivel ? 'Disponível' : 'Esgotado'}</span>
            </div>
            <div class="prod-botoes">
                <button type="button" class="btn-detalhes" onclick="abrirDetalhes(${prod.id})">Detalhes</button>
                <button type="button" class="btn-add-rapido" onclick="adicionarDireto(${prod.id})" ${!prod.disponivel ? 'disabled style="background:#ccc"' : ''}>+ Adicionar</button>
                <button type="button" class="btn-toggle-disp admin-only" onclick="alternarDisponibilidade(${prod.id})">${prod.disponivel ? 'Indisponibilizar' : 'Disponibilizar'}</button>
                <button type="button" class="btn-editar-prod admin-only" onclick="abrirModalProduto(${prod.id})">Editar</button>
                <button type="button" class="btn-excluir-prod admin-only" onclick="excluirProduto(${prod.id})">Excluir</button>
            </div>
        `;
        grid.appendChild(div);
    });

    if (isAdmin) {
        document.body.classList.add('modo-admin');
    }
}

function solicitarSenhaAdmin() {
    if (isAdmin) {
        if (confirm("Deseja sair do modo administrador?")) {
            isAdmin = false;
            document.body.classList.remove('modo-admin');
            document.querySelector('.btn-admin-cadeado').innerText = '🔒';
            renderizarProdutos();
            alert("Modo administrador encerrado.");
        }
        return;
    }

    const senhaDigitada = prompt("Digite a senha de administrador:");
    if (senhaDigitada === configSite.senha) {
        isAdmin = true;
        document.body.classList.add('modo-admin');
        document.querySelector('.btn-admin-cadeado').innerText = '🔓';
        renderizarProdutos();
        alert("Acesso autorizado! Painel de gestão ativado.");
    } else if (senhaDigitada !== null) {
        alert("Senha incorreta!");
    }
}

function alternarDisponibilidade(id) {
    if (!isAdmin) return;
    const prod = listaProdutos.find(p => p.id === id);
    if (prod) {
        prod.disponivel = !prod.disponivel;
        salvarBanco();
        renderizarProdutos();
    }
}

function excluirProduto(id) {
    if (!isAdmin) return;
    if (confirm("Tem certeza que deseja excluir este produto?")) {
        listaProdutos = listaProdutos.filter(p => p.id !== id);
        delete carrinho[id];
        salvarBanco();
        renderizarProdutos();
        atualizarCarrinhoVisual();
    }
}

function abrirModalProduto(id = null) {
    if (!isAdmin) return;
    document.getElementById('edit-prod-id').value = '';
    document.getElementById('input-prod-icone').value = '';
    document.getElementById('input-prod-nome').value = '';
    document.getElementById('input-prod-preco-mg').value = '';
    document.getElementById('input-prod-preco-br').value = '';
    document.getElementById('input-prod-desc').value = '';

    if (id) {
        const prod = listaProdutos.find(p => p.id === id);
        if (prod) {
            document.getElementById('edit-prod-id').value = prod.id;
            document.getElementById('input-prod-icone').value = prod.img;
            document.getElementById('input-prod-nome').value = prod.nome;
            document.getElementById('input-prod-preco-mg').value = prod.precoMG;
            document.getElementById('input-prod-preco-br').value = prod.precoBR;
            document.getElementById('input-prod-desc').value = prod.desc;
        }
    }
    document.getElementById('modal-produto').style.display = 'flex';
}

function fecharModalProduto() {
    document.getElementById('modal-produto').style.display = 'none';
}

function salvarProduto() {
    const id = document.getElementById('edit-prod-id').value;
    const img = document.getElementById('input-prod-icone').value.trim() || "https://via.placeholder.com/150?text=Produto";
    const nome = document.getElementById('input-prod-nome').value.trim();
    const precoMG = parseFloat(document.getElementById('input-prod-preco-mg').value);
    const precoBR = parseFloat(document.getElementById('input-prod-preco-br').value);
    const desc = document.getElementById('input-prod-desc').value.trim();

    if (!nome || isNaN(precoMG) || isNaN(precoBR)) {
        alert("Preencha o nome, o preço de Minas Gerais e o preço do Resto do Brasil!");
        return;
    }

    if (id) {
        const prod = listaProdutos.find(p => p.id == id);
        if (prod) {
            prod.img = img;
            prod.nome = nome;
            prod.precoMG = precoMG;
            prod.precoBR = precoBR;
            prod.desc = desc;
        }
    } else {
        const novoId = listaProdutos.length > 0 ? Math.max(...listaProdutos.map(p => p.id)) + 1 : 1;
        listaProdutos.push({
            id: novoId,
            nome: nome,
            precoMG: precoMG,
            precoBR: precoBR,
            desc: desc || "Produto artesanal da roça.",
            img: img,
            disponivel: true
        });
    }

    salvarBanco();
    fecharModalProduto();
    renderizarProdutos();
    atualizarCarrinhoVisual();
}

function abrirModalConfig() {
    if (!isAdmin) return;
    document.getElementById('conf-nome-site').value = configSite.nome;
    document.getElementById('conf-desc-site').value = configSite.desc;
    document.getElementById('conf-nova-senha').value = '';
    document.getElementById('modal-config').style.display = 'flex';
}

function fecharModalConfig() {
    document.getElementById('modal-config').style.display = 'none';
}

function salvarConfiguracoes() {
    const novoNome = document.getElementById('conf-nome-site').value.trim();
    const novaDesc = document.getElementById('conf-desc-site').value.trim();
    const novaSenha = document.getElementById('conf-nova-senha').value.trim();

    if (novoNome) configSite.nome = novoNome;
    if (novaDesc) configSite.desc = novaDesc;
    if (novaSenha) {
        configSite.senha = novaSenha;
        alert("Senha de administrador alterada com sucesso!");
    }

    localStorage.setItem('vargem_config', JSON.stringify(configSite));
    aplicarConfiguracoes();
    fecharModalConfig();
    alert("Configurações salvas com sucesso!");
}

function salvarBanco() {
    localStorage.setItem('vargem_produtos', JSON.stringify(listaProdutos));
}

function abrirDetalhes(id) {
    const prod = listaProdutos.find(p => p.id === id);
    if (!prod) return;

    produtoAtual = prod;
    const precoAtivo = obterPrecoAtivo(prod);
    document.getElementById('modal-icone').innerHTML = `<img src="${prod.img}" alt="${prod.nome}" style="width: 140px; height: 140px; object-fit: cover; border-radius: 12px; border: 1px solid #ddd;">`;
    document.getElementById('modal-titulo').innerText = prod.nome;
    document.getElementById('modal-preco').innerText = `R$ ${precoAtivo.toFixed(2).replace('.', ',')}`;
    document.getElementById('modal-descricao').innerText = prod.desc;
    
    const btnModalAdd = document.getElementById('btn-modal-add');
    if (!prod.disponivel) {
        btnModalAdd.innerText = 'Produto Esgotado';
        btnModalAdd.disabled = true;
        btnModalAdd.style.backgroundColor = '#ccc';
    } else {
        btnModalAdd.innerText = 'Adicionar ao Carrinho';
        btnModalAdd.disabled = false;
        btnModalAdd.style.backgroundColor = '#25d366';
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

function adicionarDireto(id) {
    const prod = listaProdutos.find(p => p.id === id);
    if (!prod || !prod.disponivel) return;
    adicionarAoCarrinho(prod.id, 1);
}

function adicionarDoModalAoCarrinho() {
    if (produtoAtual && produtoAtual.disponivel) {
        adicionarAoCarrinho(produtoAtual.id, qtdModal);
        fecharDetalhes();
    }
}

function adicionarAoCarrinho(id, qtd) {
    if (carrinho[id]) {
        carrinho[id] += qtd;
    } else {
        carrinho[id] = qtd;
    }
    atualizarCarrinhoVisual();
}

function alterarQtdCarrinho(id, valor) {
    carrinho[id] += valor;
    if (carrinho[id] <= 0) delete carrinho[id];
    atualizarCarrinhoVisual();
}

function atualizarCarrinhoVisual() {
    const lista = document.getElementById('lista-carrinho-itens');
    const avisoVazio = document.getElementById('lista-carrinho-vazia');
    const containerTotal = document.getElementById('container-total');
    const containerCliente = document.getElementById('container-cliente');
    const btnWhatsapp = document.getElementById('btn-enviar-whatsapp');
    
    lista.innerHTML = '';
    let total = 0, temItens = false;

    for (let id in carrinho) {
        const prod = listaProdutos.find(p => p.id == id);
        if (!prod) continue;

        temItens = true;
        const qtd = carrinho[id];
        const precoUnitario = obterPrecoAtivo(prod);
        total += precoUnitario * qtd;

        const li = document.createElement('li');
        li.className = 'carrinho-item-linha';
        li.innerHTML = `
            <span>${prod.nome} (R$ ${precoUnitario.toFixed(2).replace('.', ',')})</span>
            <div class="seletor-qtd">
                <button type="button" onclick="alterarQtdCarrinho(${prod.id}, -1)">-</button>
                <span>${qtd}</span>
                <button type="button" onclick="alterarQtdCarrinho(${prod.id}, 1)">+</button>
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
    const regiaoTexto = isMinasGerais ? "Minas Gerais" : "Resto do Brasil";
    
    let mensagem = `Olá! Gostaria de fazer o seguinte pedido de *${configSite.nome}*:\n\n`;
    if (nomeCliente) mensagem += `*Cliente:* ${nomeCliente}\n`;
    if (cepDigitado) mensagem += `*CEP:* ${cepDigitado} (${regiaoTexto})\n`;
    else mensagem += `*Região:* ${regiaoTexto}\n`;
    
    mensagem += `\n*Itens do Pedido:*\n`;
    let totalGeral = 0;
    for (let id in carrinho) {
        const prod = listaProdutos.find(p => p.id == id);
        if (!prod) continue;
        
        const qtd = carrinho[id];
        const precoUnitario = obterPrecoAtivo(prod);
        const subtotal = precoUnitario * qtd;
        totalGeral += subtotal;
        mensagem += `• ${qtd}x ${prod.nome} - R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    }
    mensagem += `\n*Total Estimado: R$ ${totalGeral.toFixed(2).replace('.', ',')}*`;

    window.open(`https://wa.me/5531982477418?text=${encodeURIComponent(mensagem)}`, '_blank');
}
