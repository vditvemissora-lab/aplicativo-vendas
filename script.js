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
    event.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const senha = document.getElementById("login-senha").value.trim();
    const lembrar = document.getElementById("login-lembrar").checked;

    if (email === configSite.adminEmail.toLowerCase() && senha === configSite.adminSenha) {
        usuarioAtual = { email, nome: "Administrador / Vendedor", perfil: "vendedor" };
        salvarSessao(lembrar);
        abrirInterfacePorPerfil();
        return;
    }

    if (modoCadastro) {
        const nome = document.getElementById("login-nome").value.trim();
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
    const lista =
