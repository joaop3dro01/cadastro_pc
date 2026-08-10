// Redirect to login if token not present
if (window.location.pathname.endsWith('index.html') && !localStorage.getItem('token')) {
    window.location.href = 'login.html';
}

function abrirTab(index) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.querySelectorAll('.tab-content')[index].classList.add('active');
    document.querySelectorAll('.tab-btn')[index].classList.add('active');

    if (index === 0) {
        listarClientes();
    }
}

function formatarResposta(resultado) {
    if (resultado.erro) {
        return `<div class="alert alert-error">
                    ⚠️ Erro: ${resultado.erro}
                </div>`;
    }

    let html = `<div class="alert alert-success">`;
    html += `<h3>✅ Sucesso</h3>`;
    html += `<ul>`;

    for (const [key, value] of Object.entries(resultado)) {
        // Capitaliza a primeira letra e ajusta o nome (ex: imc -> IMC)
        let label = key.charAt(0).toUpperCase() + key.slice(1);
        if (key.toLowerCase() === 'imc') label = 'IMC';

        html += `<li><strong>${label}:</strong> ${value}</li>`;
    }

    html += `</ul></div>`;
    return html;
}

async function calcularIMC() {
    const dados = {
        nome: document.getElementById("nome").value,
        idade: document.getElementById("idade").value,
        altura: document.getElementById("altura").value,
        peso: document.getElementById("peso").value
    };

    try {
        const res = await fetch("http://localhost:3000/imc", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await res.json();
        document.getElementById("resultadoIMC").innerHTML = formatarResposta(resultado);
    } catch (erro) {
        document.getElementById("resultadoIMC").innerHTML = formatarResposta({ erro: "Falha na comunicação com o servidor." });
    }
}

async function cadastrarCliente() {
    const dados = {
        cpf: document.getElementById("cliente_cpf").value,
        nome: document.getElementById("cliente_nome").value,
        idade: document.getElementById("cliente_idade").value,
        endereco: document.getElementById("cliente_endereco").value,
        bairro: document.getElementById("cliente_bairro").value,
        contato: document.getElementById("cliente_contato").value
    };

    try {
        const res = await fetch("http://localhost:3000/clientes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await res.json();
        document.getElementById("resultadoCliente").innerHTML = formatarResposta(resultado);
    } catch (erro) {
        document.getElementById("resultadoCliente").innerHTML = formatarResposta({ erro: "Falha na comunicação com o servidor." });
    }
}

async function login() {
    const dados = {
        user: document.getElementById("user").value,
        senha: document.getElementById("senha").value
    }

    try {
        const res = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await res.json();
        if (resultado.token) {
            localStorage.setItem("token", resultado.token);
            window.location.href = "index.html";
        } else {
            alert("Login inválido!");
        }
    } catch (erro) {
        alert("Falha na comunicação com o servidor.");
    }
}

async function cadastrarUsuario() {
    const dados = {
        nome: document.getElementById("nome").value,
        email: document.getElementById("email").value,
        senha: document.getElementById("senha").value
    }

    try {
        const res = await fetch("http://localhost:3000/usuarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await res.json();
        if (resultado.token) {
            localStorage.setItem("token", resultado.token);
            window.location.href = "index.html";
        } else {
            alert("Cadastro inválido!");
        }
    } catch (erro) {
        alert("Falha na comunicação com o servidor.");
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

async function listarClientes() {
    const buscaInput = document.getElementById("busca_cpf");
    if (buscaInput) buscaInput.value = "";

    try {
        const res = await fetch("http://localhost:3000/clientes");
        const clientes = await res.json();
        renderizarClientes(clientes);
    } catch (erro) {
        const container = document.getElementById("listaClientes");
        if (container) {
            container.innerHTML = `<div class="alert alert-error">⚠️ Falha ao carregar clientes do servidor.</div>`;
        }
    }
}

async function buscarClientes() {
    const cpfBusca = document.getElementById("busca_cpf").value.trim();
    if (!cpfBusca) {
        listarClientes();
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/clientes");
        const clientes = await res.json();
        
        const cpfLimpo = cpfBusca.replace(/\D/g, '');
        const filtrados = clientes.filter(c => c.cpf && c.cpf.replace(/\D/g, '') === cpfLimpo);
        renderizarClientes(filtrados);
    } catch (erro) {
        const container = document.getElementById("listaClientes");
        if (container) {
            container.innerHTML = `<div class="alert alert-error">⚠️ Falha ao buscar cliente.</div>`;
        }
    }
}

function renderizarClientes(clientes) {
    const container = document.getElementById("listaClientes");
    if (!container) return;

    if (!clientes || clientes.length === 0) {
        container.innerHTML = `<div class="no-clients">Nenhum cliente encontrado.</div>`;
        return;
    }

    let html = "";
    clientes.forEach(cliente => {
        html += `
            <div class="client-card">
                <h3>${cliente.nome || 'Sem Nome'}</h3>
                <p><strong>CPF:</strong> ${cliente.cpf || '-'}</p>
                <p><strong>Idade:</strong> ${cliente.idade || '-'} anos</p>
                <p><strong>Endereço:</strong> ${cliente.endereco || '-'}, ${cliente.bairro || '-'}</p>
                <p><strong>Contato:</strong> ${cliente.contato || '-'}</p>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Carregar lista de clientes automaticamente ao abrir index.html
if (window.location.pathname.endsWith('index.html') && localStorage.getItem('token')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', listarClientes);
    } else {
        listarClientes();
    }
}