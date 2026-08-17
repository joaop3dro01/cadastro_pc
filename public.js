// ========================================
// CONFIGURAÇÃO
// ========================================

const API = "";


// ========================================
// TOKEN
// ========================================

function pegarToken() {

    return localStorage.getItem("token");
}


// ========================================
// VERIFICAR LOGIN
// ========================================

function verificarLogin() {

    const token = pegarToken();

    if (!token) {

        window.location.href =
            "/login.html";

        return false;
    }

    return true;
}


// ========================================
// HEADERS
// ========================================

function headers() {

    const token = pegarToken();

    return {

        "Content-Type":
            "application/json",

        "Authorization":
            `Bearer ${token}`
    };
}


// ========================================
// ABRIR ABA
// ========================================

function abrirTab(numero) {

    const botoes =
        document.querySelectorAll(
            ".tab-btn"
        );

    const conteudos =
        document.querySelectorAll(
            ".tab-content"
        );

    botoes.forEach(botao => {

        botao.classList.remove(
            "active"
        );

    });

    conteudos.forEach(conteudo => {

        conteudo.classList.remove(
            "active"
        );

    });

    if (botoes[numero]) {

        botoes[numero]
            .classList.add("active");
    }

    if (conteudos[numero]) {

        conteudos[numero]
            .classList.add("active");
    }
}


// ========================================
// LISTAR PEÇAS
// ========================================

async function listarPecas() {

    if (!verificarLogin()) {
        return;
    }

    const lista =
        document.getElementById(
            "listaPecas"
        );

    if (!lista) {
        return;
    }

    lista.innerHTML =
        `<div class="loading">
            Carregando peças...
        </div>`;

    try {

        const resposta =
            await fetch(
                "/pecas",
                {
                    method: "GET",
                    headers: headers()
                }
            );

        const dados =
            await resposta.json();

        if (resposta.status === 401) {

            logout();

            return;
        }

        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                "Erro ao carregar peças."
            );
        }

        mostrarPecas(dados);

    } catch (erro) {

        console.error(erro);

        lista.innerHTML =
            `<div class="erro">
                ${escapar(erro.message)}
            </div>`;
    }
}


// ========================================
// MOSTRAR PEÇAS
// ========================================

function mostrarPecas(pecas) {

    const lista =
        document.getElementById(
            "listaPecas"
        );

    if (!lista) {
        return;
    }

    if (
        !Array.isArray(pecas) ||
        pecas.length === 0
    ) {

        lista.innerHTML =
            `<div class="vazio">
                <h3>Nenhuma peça cadastrada</h3>
                <p>
                    Cadastre uma peça para ela aparecer aqui.
                </p>
            </div>`;

        return;
    }

    lista.innerHTML =
        pecas.map(peca => {

            const preco =
                Number(peca.preco)
                    .toLocaleString(
                        "pt-BR",
                        {
                            style: "currency",
                            currency: "BRL"
                        }
                    );

            return `
                <div class="peca-card">

                    <div class="peca-info">

                        <h3>
                            ${escapar(peca.nome)}
                        </h3>

                        <p>
                            <strong>Categoria:</strong>
                            ${escapar(peca.categoria)}
                        </p>

                        <p>
                            <strong>Marca:</strong>
                            ${escapar(peca.marca)}
                        </p>

                        <p>
                            <strong>Modelo:</strong>
                            ${escapar(peca.modelo)}
                        </p>

                        <p>
                            <strong>Estoque:</strong>
                            ${peca.estoque}
                        </p>

                    </div>

                    <div class="peca-preco">

                        <strong>
                            ${preco}
                        </strong>

                        <button
                            type="button"
                            onclick="excluirPeca(${peca.id})"
                        >
                            🗑️ Excluir
                        </button>

                    </div>

                </div>
            `;

        }).join("");
}


// ========================================
// BUSCAR PEÇAS
// ========================================

async function buscarPecas() {

    if (!verificarLogin()) {
        return;
    }

    const campo =
        document.getElementById(
            "buscaPeca"
        );

    if (!campo) {
        return;
    }

    const termo =
        campo.value.trim();

    try {

        const resposta =
            await fetch(
                `/pecas/buscar?termo=${encodeURIComponent(termo)}`,
                {
                    method: "GET",
                    headers: headers()
                }
            );

        const dados =
            await resposta.json();

        if (resposta.status === 401) {

            logout();

            return;
        }

        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                "Erro ao pesquisar."
            );
        }

        mostrarPecas(dados);

    } catch (erro) {

        console.error(erro);

        const lista =
            document.getElementById(
                "listaPecas"
            );

        if (lista) {

            lista.innerHTML =
                `<div class="erro">
                    ${escapar(erro.message)}
                </div>`;
        }
    }
}


// ========================================
// CADASTRAR PEÇA
// ========================================

async function cadastrarPeca(event) {

    event.preventDefault();

    if (!verificarLogin()) {
        return;
    }

    const resultado =
        document.getElementById(
            "resultadoPeca"
        );

    const dados = {

        nome:
            document.getElementById(
                "pecaNome"
            ).value.trim(),

        categoria:
            document.getElementById(
                "pecaCategoria"
            ).value,

        marca:
            document.getElementById(
                "pecaMarca"
            ).value.trim(),

        modelo:
            document.getElementById(
                "pecaModelo"
            ).value.trim(),

        preco:
            document.getElementById(
                "pecaPreco"
            ).value,

        estoque:
            document.getElementById(
                "pecaEstoque"
            ).value
    };

    try {

        const resposta =
            await fetch(
                "/pecas",
                {
                    method: "POST",

                    headers: headers(),

                    body:
                        JSON.stringify(dados)
                }
            );

        const retorno =
            await resposta.json();

        if (resposta.status === 401) {

            logout();

            return;
        }

        if (!resposta.ok) {

            throw new Error(
                retorno.erro ||
                "Erro ao cadastrar peça."
            );
        }

        resultado.innerHTML =
            `<div class="sucesso">
                ${escapar(
                    retorno.mensagem ||
                    "Peça cadastrada com sucesso!"
                )}
            </div>`;

        const formulario =
            document.getElementById(
                "formPeca"
            );

        if (formulario) {
            formulario.reset();
        }

        await listarPecas();

        abrirTab(0);

    } catch (erro) {

        console.error(erro);

        resultado.innerHTML =
            `<div class="erro">
                ${escapar(erro.message)}
            </div>`;
    }
}


// ========================================
// EXCLUIR PEÇA
// ========================================

async function excluirPeca(id) {

    if (!verificarLogin()) {
        return;
    }

    const confirmar =
        confirm(
            "Deseja realmente excluir esta peça?"
        );

    if (!confirmar) {
        return;
    }

    try {

        const resposta =
            await fetch(
                `/pecas/${id}`,
                {
                    method: "DELETE",
                    headers: headers()
                }
            );

        const dados =
            await resposta.json();

        if (resposta.status === 401) {

            logout();

            return;
        }

        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                "Erro ao excluir peça."
            );
        }

        await listarPecas();

    } catch (erro) {

        console.error(erro);

        alert(
            erro.message
        );
    }
}


// ========================================
// LOGOUT
// ========================================

function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "usuario"
    );

    window.location.href =
        "/login.html";
}


// ========================================
// ESCAPAR HTML
// ========================================

function escapar(valor) {

    return String(valor)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


// ========================================
// INICIAR
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const pagina =
            window.location.pathname;

        if (
            pagina.endsWith(
                "/pecas.html"
            )
        ) {

            if (verificarLogin()) {

                listarPecas();
            }
        }
    }
);