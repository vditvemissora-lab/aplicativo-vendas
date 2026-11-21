const CONFIG_NUVEM = {
    USAR_NUVEM: false,
    SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
    SUPABASE_ANON_KEY: "SUA-CHAVE-PUBLICA-ANON"
};

const DB = {
    async carregar(chave, padrao) {
        try {
            const salvo = localStorage.getItem(chave);
            if (!salvo) return padrao;
            const parsed = JSON.parse(salvo);
            return Array.isArray(padrao) && (!Array.isArray(parsed) || parsed.length === 0) ? padrao : parsed;
        } catch (e) {
            return padrao;
        }
    },
    async salvar(chave, dados) {
        localStorage.setItem(chave, JSON.stringify(dados));
    }
};

let usuarioAtual = null;
let modoCadastro = false;
let carrinho = {};
let produtoAtual = null;
let qtdModal = 1;
let isMinasGerais = true;
let cepDigitado = "";
let filtroAtualVendedor = "pendente";
let notaSelecionada = 5;

const produtosIniciais = [
    { id: 1, nome: "Queijo Fresco", precoMG: 22.00, precoBR: 26.00, desc: "Queijo fresquinho e caseiro, feito de forma artesanal.", img: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200", disponivel: true },
    { id: 2, nome: "Queijo Curado", precoMG: 25.00, precoBR: 29.00, desc: "Queijo artesanal curado, ponto de maturação ideal.", img: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=200", disponivel: true },
    { id: 3, nome: "Mel (500g)", precoMG: 16.00, precoBR: 19.00, desc: "Mel puro e natural, pote com 500 gramas.", img: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=200", disponivel: true },
    { id: 4, nome: "Leite (Pet 2L)", precoMG: 8.00, precoBR: 11.00, desc: "Leite puro de fazenda engarrafado fresco.", img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200", disponivel: true },
    { id: 5, nome: "Ovos Caipira (Pente 30)", precoMG: 30.00, precoBR: 35.00, desc: "Ovos de galinhas criadas soltas no terreiro.", img: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=200", disponivel: true }
];

let listaProdutos = [...produtosIniciais];
let listaPedidos = [];
let listaUsuarios = [];
let configSite = {
    nome: "Produtos Vargem do Itacolomi",
    desc: "Escolha seus produtos, acompanhe o envio e confirme o recebimento direto por aqui.",
    adminEmail: "admin",
    adminSenha: "1234"
};

window.addEventListener("DOMContentLoaded", async function () {
    listaProdutos = await DB.carregar("vargem_produtos", produtosIniciais);
    listaPedidos = await DB.carregar("vargem_pedidos", []);
    listaUsuarios = await DB.carregar("vargem_usuarios", []);
    configSite = await DB.carregar("vargem_config", configSite);

    aplicarTextosLoja();

    const sessaoSalva = localStorage.getItem("vargem_sessao_ativa") || sessionStorage.getItem("vargem_sessao_ativa");
    if (sessaoSalva) {
        try {
            usuarioAtual = JSON.parse(sessaoSalva);
            abrirInterfacePorPerfil();
        } catch (e) {
            localStorage.removeItem("vargem_sessao_ativa");
        }
    }
});

function aplicarTextosLoja() {
    const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.innerText = txt;
    };
    setTxt("titulo-pagina-seo", configSite.nome);
    setTxt("login-titulo-loja", configSite.nome);
    setTxt("topo-titulo", configSite.nome);
    setTxt("topo-descricao", configSite.desc);
    setTxt("admin-titulo-loja", "Painel - " + configSite.nome);
}

function alternarCadastroLogin() {
    modoCadastro = !modoCadastro;
    document.getElementById("grupo-nome-cadastro").style.display = modoCadastro ? "flex" : "none";
    document.getElementById("btn-submit-login").innerText = modoCadastro ? "Criar Conta e Entrar" : "Entrar";
    document.getElementById("btn-alternar-modo").innerText = modoCadastro
        ? "Já tem conta? Fazer login"
        : "Não tem conta? Criar cadastro de comprador";
}

async function realizarLogin(event) {
    if (event && event.preventDefault) event.preventDefault();
    try {
        const emailEl = document.getElementById("login-email");
        const senhaEl = document.getElementById("login-senha");
        const lembrarEl = document.getElementById("login-lembrar");

        if (!emailEl || !senhaEl) {
            alert("Campo de login não encontrado no HTML.");
            return;
        }

        const email = emailEl.value.trim().toLowerCase();
        const senha = senhaEl.value.trim();
        const lembrar = lembrarEl ? lembrarEl.checked : true;

        if (!email || !senha) {
            alert("Preencha usuário/e-mail e senha.");
            return;
        }

        if (email === configSite.adminEmail.toLowerCase() && senha === configSite.adminSenha) {
            usuarioAtual = { email, nome: "Administrador / Vendedor", perfil: "vendedor" };
            salvarSessao(lembrar);
            abrirInterfacePorPerfil();
            return;
        }

        if (modoCadastro) {
            const nomeEl = document.getElementById("login-nome");
            const nome = nomeEl ? nomeEl.value.trim() : "";
            if (!nome) {
                alert("Digite seu nome completo para concluir o cadastro.");
                return;
            }
            if (listaUsuarios.some(u => u.email === email)) {
                alert("Este e-mail já está cadastrado. Faça login normalmente.");
                alternarCadastroLogin();
                return;
            }
            const novoUser = { email, senha, nome, perfil: "comprador" };
            listaUsuarios.push(novoUser);
            await DB.salvar("vargem_usuarios", listaUsuarios);
            usuarioAtual = { email, nome, perfil: "comprador" };
            salvarSessao(lembrar);
            abrirInterfacePorPerfil();
            return;
        }

        let user = listaUsuarios.find(u => u.email === email);
        if (user) {
            if (user.senha !== senha) {
                alert("Senha incorreta!");
                return;
            }
            usuarioAtual = { email: user.email, nome: user.nome, perfil: "comprador" };
        } else {
            const nomeDerivado = email.split("@")[0] || "Cliente";
            user = { email, senha, nome: nomeDerivado, perfil: "comprador" };
            listaUsuarios.push(user);
            await DB.salvar("vargem_usuarios", listaUsuarios);
            usuarioAtual = { email: user.email, nome: user.nome, perfil: "comprador" };
        }

        salvarSessao(lembrar);
        abrirInterfacePorPerfil();
    } catch (err) {
        alert("Erro no login: " + err.message);
    }
}

function salvarSessao(lembrar) {
    const json = JSON.stringify(usuarioAtual);
    if (lembrar) {
        localStorage.setItem("vargem_sessao_ativa", json);
        sessionStorage.removeItem("vargem_sessao_ativa");
    } else {
        sessionStorage.setItem("vargem_sessao_ativa", json);
        localStorage.removeItem("vargem_sessao_ativa");
    }
}

function sairDaConta() {
    usuarioAtual = null;
    localStorage.removeItem("vargem_sessao_ativa");
    sessionStorage.removeItem("vargem_sessao_ativa");
    document.getElementById("barra-usuario").style.display = "none";
    document.getElementById("area-comprador").style.display = "none";
    document.getElementById("area-vendedor").style.display = "none";
    document.getElementById("tela-login").style.display = "flex";
}

function abrirInterfacePorPerfil() {
    document.getElementById("tela-login").style.display = "none";
    document.getElementById("barra-usuario").style.display = "block";
    document.getElementById("usuario-logado-nome").innerText = usuarioAtual.nome;

    if (usuarioAtual.perfil === "vendedor") {
        document.getElementById("usuario-logado-perfil").innerText = "Vendedor";
        document.getElementById("area-comprador").style.display = "none";
        document.getElementById("area-vendedor").style.display = "block";
        renderizarPainelVendedor();
    } else {
        document.getElementById("usuario-logado-perfil").innerText = "Comprador";
        document.getElementById("area-vendedor").style.display = "none";
        document.getElementById("area-comprador").style.display = "block";
        renderizarVitrineComprador();
        renderizarPedidosComprador();
    }
}

function obterPrecoAtivo(prod) {
    return isMinasGerais ? prod.precoMG : prod.precoBR;
}

function mascaraEVerificarCEP(input) {
    let valor = input.value.replace(/\D/g, "");
    if (valor.length > 5) valor = valor.substring(0, 5) + "-" + valor.substring(5, 8);
    input.value = valor;
    cepDigitado = valor;

    const numeros = valor.replace(/\D/g, "");
    const status = document.getElementById("status-cep-discreto");

    if (numeros.length === 8) {
        isMinasGerais = numeros.startsWith("3");
        status.innerText = "✓ CEP confirmado";
    } else {
        isMinasGerais = true;
        status.innerText = "";
    }

    renderizarVitrineComprador();
    atualizarCarrinhoVisual();
}

function mudarAbaComprador(aba) {
    document.getElementById("tab-comp-vitrine").classList.toggle("ativa", aba === "vitrine");
    document.getElementById("tab-comp-pedidos").classList.toggle("ativa", aba === "pedidos");
    document.getElementById("sub-comprador-vitrine").style.display = aba === "vitrine" ? "block" : "none";
    document.getElementById("sub-comprador-pedidos").style.display = aba === "pedidos" ? "block" : "none";
    if (aba === "vitrine") renderizarVitrineComprador();
    if (aba === "pedidos") renderizarPedidosComprador();
}

function renderizarVitrineComprador() {
    const grid = document.getElementById("grid-produtos");
    if (!grid) return;
    grid.innerHTML = "";

    listaProdutos.forEach(prod => {
        const preco = obterPrecoAtivo(prod);
        const div = document.createElement("div");
        div.className = "card-produto-item";
        div.innerHTML = `
            <img src="${prod.img}" alt="${prod.nome}" class="prod-foto" onerror="this.src='https://via.placeholder.com/65?text=Foto'">
            <div class="prod-info-rapida">
                <h3>${prod.nome}</h3>
                <span class="preco">R$ ${preco.toFixed(2).replace(".", ",")}</span>
                <span class="status-texto" style="color: ${prod.disponivel ? "#2e4d30" : "#d9534f"}">
                    ${prod.disponivel ? "Disponível" : "Esgotado"}
                </span>
            </div>
            <div class="prod-botoes">
                <button type="button" class="btn-detalhes" onclick="abrirDetalhes(${prod.id})">Detalhes</button>
                <button type="button" class="btn-add-rapido" onclick="adicionarDireto(${prod.id})" ${!prod.disponivel ? "disabled style='background:#ccc'" : ""}>+ Adicionar</button>
            </div>
        `;
        grid.appendChild(div);
    });
}

function abrirDetalhes(id) {
    const prod = listaProdutos.find(p => p.id === id);
    if (!prod) return;
    produtoAtual = prod;
    const preco = obterPrecoAtivo(prod);
    document.getElementById("modal-icone").innerHTML = `<img src="${prod.img}" alt="${prod.nome}" style="width:130px;height:130px;object-fit:cover;border-radius:10px;">`;
    document.getElementById("modal-titulo").innerText = prod.nome;
    document.getElementById("modal-preco").innerText = `R$ ${preco.toFixed(2).replace(".", ",")}`;
    document.getElementById("modal-descricao").innerText = prod.desc;
    qtdModal = 1;
    document.getElementById("modal-qtd").innerText = qtdModal;
    document.getElementById("modal-detalhes").style.display = "flex";
}

function fecharDetalhes() {
    document.getElementById("modal-detalhes").style.display = "none";
}

function alterarQtdModal(v) {
    qtdModal = Math.max(1, qtdModal + v);
    document.getElementById("modal-qtd").innerText = qtdModal;
}

function adicionarDireto(id) {
    carrinho[id] = (carrinho[id] || 0) + 1;
    atualizarCarrinhoVisual();
}

function adicionarDoModalAoCarrinho() {
    if (produtoAtual && produtoAtual.disponivel) {
        carrinho[produtoAtual.id] = (carrinho[produtoAtual.id] || 0) + qtdModal;
        fecharDetalhes();
        atualizarCarrinhoVisual();
    }
}

function alterarQtdCarrinho(id, v) {
    carrinho[id] += v;
    if (carrinho[id] <= 0) delete carrinho[id];
    atualizarCarrinhoVisual();
}

function atualizarCarrinhoVisual() {
    const lista = document.getElementById("lista-carrinho-itens");
    const avisoVazio = document.getElementById("lista-carrinho-vazia");
    const containerTotal = document.getElementById("container-total");
    const containerEntrega = document.getElementById("container-entrega");
    const btnFinalizar = document.getElementById("btn-finalizar-pedido");

    lista.innerHTML = "";
    let total = 0, temItens = false;

    for (let id in carrinho) {
        const prod = listaProdutos.find(p => p.id == id);
        if (!prod) continue;
        temItens = true;
        const qtd = carrinho[id];
        const preco = obterPrecoAtivo(prod);
        total += preco * qtd;

        const li = document.createElement("li");
        li.className = "carrinho-item-linha";
        li.innerHTML = `
            <span>${prod.nome} (R$ ${preco.toFixed(2).replace(".", ",")})</span>
            <div class="seletor-qtd">
                <button type="button" onclick="alterarQtdCarrinho(${prod.id}, -1)">-</button>
                <span>${qtd}</span>
                <button type="button" onclick="alterarQtdCarrinho(${prod.id}, 1)">+</button>
            </div>
        `;
        lista.appendChild(li);
    }

    avisoVazio.style.display = temItens ? "none" : "block";
    containerTotal.style.display = temItens ? "flex" : "none";
    containerEntrega.style.display = temItens ? "flex" : "none";
    btnFinalizar.style.display = temItens ? "block" : "none";
    document.getElementById("valor-total").innerText = `R$ ${total.toFixed(2).replace(".", ",")}`;
}

async function finalizarPedidoNoSite() {
    const endereco = document.getElementById("input-endereco").value.trim();
    const telefone = document.getElementById("input-telefone").value.trim();

    if (!endereco || !telefone) {
        alert("Preencha o endereço e o telefone para entrega.");
        return;
    }

    const itensPedido = [];
    let total = 0;

    for (let id in carrinho) {
        const prod = listaProdutos.find(p => p.id == id);
        if (!prod) continue;
        const qtd = carrinho[id];
        const precoUnit = obterPrecoAtivo(prod);
        total += precoUnit * qtd;
        itensPedido.push({ nome: prod.nome, qtd, precoUnit });
    }

    const novoPedido = {
        id: Math.floor(1000 + Math.random() * 9000),
        clienteEmail: usuarioAtual.email,
        clienteNome: usuarioAtual.nome,
        telefone,
        cep: cepDigitado || "Não informado",
        regiao: isMinasGerais ? "MG" : "Outros Estados",
        endereco,
        itens: itensPedido,
        total,
        status: "pendente",
        data: new Date().toLocaleString("pt-BR"),
        avaliacao: null
    };

    listaPedidos.unshift(novoPedido);
    await DB.salvar("vargem_pedidos", listaPedidos);

    carrinho = {};
    document.getElementById("input-endereco").value = "";
    atualizarCarrinhoVisual();
    renderizarPedidosComprador();
    mudarAbaComprador("pedidos");
    alert(`Pedido #${novoPedido.id} registrado com sucesso!`);
}

function renderizarPedidosComprador() {
    const container = document.getElementById("lista-pedidos-comprador");
    if (!container || !usuarioAtual) return;
    const meusPedidos = listaPedidos.filter(p => p.clienteEmail === usuarioAtual.email);
    const badge = document.getElementById("badge-pedidos-cliente");

    const ativos = meusPedidos.filter(p => p.status !== "concluido").length;
    badge.style.display = ativos > 0 ? "inline-block" : "none";
    badge.innerText = ativos;

    if (meusPedidos.length === 0) {
        container.innerHTML = "<p class='texto-descricao-centro'>Você ainda não realizou nenhum pedido.</p>";
        return;
    }

    container.innerHTML = "";
    meusPedidos.forEach(ped => {
        const div = document.createElement("div");
        div.className = "card-pedido";

        let statusLabel = "⏳ Aguardando preparo";
        let statusClass = "status-pendente";
        if (ped.status === "envio") {
            statusLabel = "🚚 Em fase de envio";
            statusClass = "status-envio";
        } else if (ped.status === "concluido") {
            statusLabel = "✅ Entregue e Concluído";
            statusClass = "status-concluido";
        }

        const itensHtml = ped.itens.map(i => `<li>${i.qtd}x ${i.nome} — R$ ${(i.qtd * i.precoUnit).toFixed(2).replace(".", ",")}</li>`).join("");

        let acaoCompradorHtml = "";
        if (ped.status === "envio") {
            acaoCompradorHtml = `<button type="button" class="btn-confirmar-recebimento" onclick="confirmarRecebimentoPedido(${ped.id})">📦 Confirmar Recebimento do Pedido</button>`;
        } else if (ped.status === "concluido" && !ped.avaliacao) {
            acaoCompradorHtml = `<button type="button" class="btn-avaliar-pedido" onclick="abrirModalAvaliacao(${ped.id})">⭐ Avaliar Pedido e Entrega</button>`;
        } else if (ped.avaliacao) {
            acaoCompradorHtml = `<div class="caixa-avaliacao-salva"><strong>Sua avaliação:</strong> ${"★".repeat(ped.avaliacao.nota)}${"☆".repeat(5 - ped.avaliacao.nota)}<br><em>"${ped.avaliacao.comentario || "Sem comentário adicional."}"</em></div>`;
        }

        div.innerHTML = `
            <div class="pedido-cabecalho">
                <strong>Pedido #${ped.id}</strong>
                <span class="badge-status ${statusClass}">${statusLabel}</span>
            </div>
            <small style="color:#666;">Data: ${ped.data}</small>
            <ul class="pedido-itens-lista">${itensHtml}</ul>
            <div style="font-weight:bold; color:#2e4d30;">Total: R$ ${ped.total.toFixed(2).replace(".", ",")}</div>
            ${acaoCompradorHtml}
        `;
        container.appendChild(div);
    });
}

async function confirmarRecebimentoPedido(idPedido) {
    if (!confirm("Confirma que você já recebeu este pedido?")) return;
    const ped = listaPedidos.find(p => p.id === idPedido);
    if (ped) {
        ped.status = "concluido";
        ped.dataRecebimento = new Date().toLocaleString("pt-BR");
        await DB.salvar("vargem_pedidos", listaPedidos);
        renderizarPedidosComprador();
        abrirModalAvaliacao(idPedido);
    }
}

function abrirModalAvaliacao(idPedido) {
    document.getElementById("aval-pedido-id").value = idPedido;
    document.getElementById("aval-comentario").value = "";
    selecionarNota(5);
    document.getElementById("modal-avaliacao").style.display = "flex";
}

function fecharModalAvaliacao() {
    document.getElementById("modal-avaliacao").style.display = "none";
}

function selecionarNota(nota) {
    notaSelecionada = nota;
    document.querySelectorAll("#estrelas-seletor span").forEach(s => {
        s.classList.toggle("ativa", parseInt(s.dataset.nota) <= nota);
    });
}

async function enviarAvaliacaoPedido() {
    const idPedido = parseInt(document.getElementById("aval-pedido-id").value);
    const comentario = document.getElementById("aval-comentario").value.trim();
    const ped = listaPedidos.find(p => p.id === idPedido);
    if (ped) {
        ped.avaliacao = { nota: notaSelecionada, comentario, data: new Date().toLocaleString("pt-BR") };
        await DB.salvar("vargem_pedidos", listaPedidos);
        fecharModalAvaliacao();
        renderizarPedidosComprador();
        alert("Obrigado pela sua avaliação!");
    }
}

function renderizarPainelVendedor() {
    atualizarContadoresVendedor();
    filtrarPedidosVendedor(filtroAtualVendedor);
    renderizarProdutosAdmin();
    renderizarAvaliacoesVendedor();
    document.getElementById("conf-nome-site").value = configSite.nome;
    document.getElementById("conf-desc-site").value = configSite.desc;
}

function mudarAbaVendedor(aba) {
    ["pedidos", "produtos", "avaliacoes", "config"].forEach(nome => {
        document.getElementById(`tab-vend-${nome}`).classList.toggle("ativa", aba === nome);
        document.getElementById(`sub-vendedor-${nome}`).style.display = aba === nome ? "block" : "none";
    });
    if (aba === "produtos") renderizarProdutosAdmin();
    if (aba === "pedidos") filtrarPedidosVendedor(filtroAtualVendedor);
    if (aba === "avaliacoes") renderizarAvaliacoesVendedor();
}

function atualizarContadoresVendedor() {
    document.getElementById("cont-pendente").innerText = listaPedidos.filter(p => p.status === "pendente").length;
    document.getElementById("cont-envio").innerText = listaPedidos.filter(p => p.status === "envio").length;
    document.getElementById("cont-concluido").innerText = listaPedidos.filter(p => p.status === "concluido").length;
}

function filtrarPedidosVendedor(status) {
    filtroAtualVendedor = status;
    ["pendente", "envio", "concluido"].forEach(st => {
        document.getElementById(`filtro-${st}`).classList.toggle("ativo", st === status);
    });

    const container = document.getElementById("lista-pedidos-vendedor");
    const filtrados = listaPedidos.filter(p => p.status === status);

    if (filtrados.length === 0) {
        container.innerHTML = "<div class='card-bloco texto-descricao-centro'>Nenhum pedido nesta etapa no momento.</div>";
        return;
    }

    container.innerHTML = "";
    filtrados.forEach(ped => {
        const div = document.createElement("div");
        div.className = "card-pedido";
        const itensHtml = ped.itens.map(i => `<li>${i.qtd}x ${i.nome} — R$ ${(i.qtd * i.precoUnit).toFixed(2).replace(".", ",")}</li>`).join("");

        let botaoAcao = "";
        if (ped.status === "pendente") {
            botaoAcao = `<button type="button" class="btn-avancar-status" onclick="alterarStatusPedido(${ped.id}, 'envio')">🚚 Marcar como Em Fase de Envio</button>`;
        } else if (ped.status === "envio") {
            botaoAcao = `<small style="color:#004085; font-weight:bold;">Aguardando comprador confirmar o recebimento...</small>`;
        } else if (ped.avaliacao) {
            botaoAcao = `<div class="caixa-avaliacao-salva"><strong>Avaliação do cliente:</strong> ${"★".repeat(ped.avaliacao.nota)} — "${ped.avaliacao.comentario || "Sem comentário"}"</div>`;
        }

        div.innerHTML = `
            <div class="pedido-cabecalho">
                <strong>Pedido #${ped.id} — ${ped.clienteNome}</strong>
                <span style="font-weight:bold; color:#2e4d30;">R$ ${ped.total.toFixed(2).replace(".", ",")}</span>
            </div>
            <div style="font-size:13px; color:#555; line-height:1.5;">
                <strong>Data:</strong> ${ped.data}<br>
                <strong>Contato:</strong> ${ped.telefone} (${ped.clienteEmail})<br>
                <strong>Entrega:</strong> ${ped.endereco} | CEP: ${ped.cep} (${ped.regiao})
            </div>
            <ul class="pedido-itens-lista">${itensHtml}</ul>
            <div style="margin-top:10px;">${botaoAcao}</div>
        `;
        container.appendChild(div);
    });
}

async function alterarStatusPedido(idPedido, novoStatus) {
    const ped = listaPedidos.find(p => p.id === idPedido);
    if (ped) {
        ped.status = novoStatus;
        await DB.salvar("vargem_pedidos", listaPedidos);
        atualizarContadoresVendedor();
        filtrarPedidosVendedor(filtroAtualVendedor);
    }
}

function renderizarProdutosAdmin() {
    const grid = document.getElementById("grid-produtos-admin");
    if (!grid) return;
    grid.innerHTML = "";

    listaProdutos.forEach(prod => {
        const div = document.createElement("div");
        div.className = "card-produto-item";
        div.innerHTML = `
            <img src="${prod.img}" alt="${prod.nome}" class="prod-foto" onerror="this.src='https://via.placeholder.com/65?text=Foto'">
            <div class="prod-info-rapida">
                <h3>${prod.nome}</h3>
                <span style="font-size:12px; color:#2e4d30; font-weight:bold;">Local/MG: R$ ${Number(prod.precoMG).toFixed(2).replace(".", ",")} | Demais: R$ ${Number(prod.precoBR).toFixed(2).replace(".", ",")}</span>
                <span class="status-texto" style="color:${prod.disponivel ? "#2e4d30" : "#d9534f"}">${prod.disponivel ? "Ativo na vitrine" : "Pausado"}</span>
            </div>
            <div class="prod-botoes">
                <button type="button" class="btn-editar-prod" onclick="abrirModalProduto(${prod.id})">Editar</button>
                <button type="button" class="btn-toggle-disp" onclick="alternarDispAdmin(${prod.id})">${prod.disponivel ? "Pausar" : "Ativar"}</button>
                <button type="button" class="btn-excluir-prod" onclick="excluirProdAdmin(${prod.id})">Excluir</button>
            </div>
        `;
        grid.appendChild(div);
    });
}

function abrirModalProduto(id = null) {
    document.getElementById("edit-prod-id").value = "";
    document.getElementById("input-prod-icone").value = "";
    document.getElementById("input-prod-nome").value = "";
    document.getElementById("input-prod-preco-mg").value = "";
    document.getElementById("input-prod-preco-br").value = "";
    document.getElementById("input-prod-desc").value = "";

    if (id) {
        const prod = listaProdutos.find(p => p.id === id);
        if (prod) {
            document.getElementById("edit-prod-id").value = prod.id;
            document.getElementById("input-prod-icone").value = prod.img;
            document.getElementById("input-prod-nome").value = prod.nome;
            document.getElementById("input-prod-preco-mg").value = prod.precoMG;
            document.getElementById("input-prod-preco-br").value = prod.precoBR;
            document.getElementById("input-prod-desc").value = prod.desc;
        }
    }
    document.getElementById("modal-produto").style.display = "flex";
}

function fecharModalProduto() {
    document.getElementById("modal-produto").style.display = "none";
}

async function salvarProduto() {
    try {
        const id = document.getElementById("edit-prod-id").value;
        const img = document.getElementById("input-prod-icone").value.trim() || "https://via.placeholder.com/150?text=Produto";
        const nome = document.getElementById("input-prod-nome").value.trim();
        const precoMG = parseFloat(document.getElementById("input-prod-preco-mg").value.replace(",", "."));
        const precoBR = parseFloat(document.getElementById("input-prod-preco-br").value.replace(",", "."));
        const desc = document.getElementById("input-prod-desc").value.trim();

        if (!nome || isNaN(precoMG) || isNaN(precoBR)) {
            alert("Preencha o nome e os dois preços corretamente!");
            return;
        }

        if (id) {
            const prod = listaProdutos.find(p => p.id == id);
            if (prod) Object.assign(prod, { img, nome, precoMG, precoBR, desc });
        } else {
            const novoId = listaProdutos.length > 0 ? Math.max(...listaProdutos.map(p => p.id)) + 1 : 1;
            listaProdutos.push({ id: novoId, nome, precoMG, precoBR, desc: desc || "Produto artesanal.", img, disponivel: true });
        }

        await DB.salvar("vargem_produtos", listaProdutos);
        fecharModalProduto();
        renderizarProdutosAdmin();
    } catch (err) {
        alert("Erro ao salvar produto: " + err.message);
    }
}

async function alternarDispAdmin(id) {
    const prod = listaProdutos.find(p => p.id === id);
    if (prod) {
        prod.disponivel = !prod.disponivel;
        await DB.salvar("vargem_produtos", listaProdutos);
        renderizarProdutosAdmin();
    }
}

async function excluirProdAdmin(id) {
    if (confirm("Deseja realmente excluir este produto?")) {
        listaProdutos = listaProdutos.filter(p => p.id !== id);
        await DB.salvar("vargem_produtos", listaProdutos);
        renderizarProdutosAdmin();
    }
}

function renderizarAvaliacoesVendedor() {
    const container = document.getElementById("lista-avaliacoes-vendedor");
    if (!container) return;
    const avaliados = listaPedidos.filter(p => p.avaliacao !== null);

    if (avaliados.length === 0) {
        container.innerHTML = "<p class='texto-descricao-centro'>Nenhuma avaliação recebida ainda.</p>";
        return;
    }

    container.innerHTML = "";
    avaliados.forEach(ped => {
        const div = document.createElement("div");
        div.className = "card-pedido";
        div.innerHTML = `
            <div class="pedido-cabecalho">
                <strong>${ped.clienteNome} (Pedido #${ped.id})</strong>
                <span style="color:#f5b301; font-size:16px;">${"★".repeat(ped.avaliacao.nota)}${"☆".repeat(5 - ped.avaliacao.nota)}</span>
            </div>
            <p style="margin:6px 0; font-size:14px;">"${ped.avaliacao.comentario || "Cliente avaliou sem comentário."}"</p>
            <small style="color:#777;">Avaliado em: ${ped.avaliacao.data}</small>
        `;
        container.appendChild(div);
    });
}

async function salvarConfiguracoes() {
    const novoNome = document.getElementById("conf-nome-site").value.trim();
    const novaDesc = document.getElementById("conf-desc-site").value.trim();
    const novaSenha = document.getElementById("conf-nova-senha").value.trim();

    if (novoNome) configSite.nome = novoNome;
    if (novaDesc) configSite.desc = novaDesc;
    if (novaSenha) configSite.adminSenha = novaSenha;

    await DB.salvar("vargem_config", configSite);
    aplicarTextosLoja();
    alert("Configurações atualizadas com sucesso!");
        }
