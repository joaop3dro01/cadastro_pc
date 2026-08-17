const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;

const CHAVE_SECRETA = "pc-store-chave-secreta";

const caminhoDados = path.join(__dirname, "dados.json");

// ========================================
// CONFIGURAÇÕES
// ========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

// ========================================
// BANCO DE DADOS
// ========================================

function criarBanco() {

    if (!fs.existsSync(caminhoDados)) {

        const dadosIniciais = {
            usuarios: [],
            pecas: []
        };

        fs.writeFileSync(
            caminhoDados,
            JSON.stringify(dadosIniciais, null, 2),
            "utf8"
        );
    }
}

function lerDados() {

    criarBanco();

    try {

        const arquivo = fs.readFileSync(
            caminhoDados,
            "utf8"
        );

        if (!arquivo.trim()) {

            return {
                usuarios: [],
                pecas: []
            };
        }

        const dados = JSON.parse(arquivo);

        if (!Array.isArray(dados.usuarios)) {
            dados.usuarios = [];
        }

        if (!Array.isArray(dados.pecas)) {
            dados.pecas = [];
        }

        return dados;

    } catch (erro) {

        console.error(
            "Erro ao ler dados.json:",
            erro
        );

        return {
            usuarios: [],
            pecas: []
        };
    }
}

function salvarDados(dados) {

    fs.writeFileSync(
        caminhoDados,
        JSON.stringify(dados, null, 2),
        "utf8"
    );
}

// ========================================
// AUTENTICAÇÃO
// ========================================

function verificarToken(req, res, next) {

    const autorizacao =
        req.headers.authorization;

    if (!autorizacao) {

        return res.status(401).json({
            erro: "Token não informado."
        });
    }

    const partes =
        autorizacao.split(" ");

    if (
        partes.length !== 2 ||
        partes[0] !== "Bearer"
    ) {

        return res.status(401).json({
            erro: "Token inválido."
        });
    }

    const token = partes[1];

    try {

        const usuario =
            jwt.verify(
                token,
                CHAVE_SECRETA
            );

        req.usuario = usuario;

        next();

    } catch (erro) {

        return res.status(401).json({
            erro: "Sessão expirada. Faça login novamente."
        });
    }
}

// ========================================
// PÁGINA INICIAL
// ========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "login.html"
        )
    );
});

// ========================================
// TESTAR API
// ========================================

app.get("/api", (req, res) => {

    res.json({
        mensagem: "API funcionando!",
        status: "online"
    });
});

// ========================================
// CADASTRAR USUÁRIO
// ========================================

app.post("/usuarios", async (req, res) => {

    try {

        const nome =
            String(req.body.nome || "")
                .trim();

        const email =
            String(req.body.email || "")
                .trim()
                .toLowerCase();

        const senha =
            String(req.body.senha || "");

        if (!nome || !email || !senha) {

            return res.status(400).json({
                erro: "Preencha todos os campos."
            });
        }

        if (senha.length < 4) {

            return res.status(400).json({
                erro: "A senha deve ter pelo menos 4 caracteres."
            });
        }

        const dados = lerDados();

        const usuarioExistente =
            dados.usuarios.find(
                usuario =>
                    String(usuario.email)
                        .toLowerCase() === email
            );

        if (usuarioExistente) {

            return res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });
        }

        const senhaCriptografada =
            await bcrypt.hash(senha, 10);

        const novoUsuario = {

            id: Date.now(),

            nome,

            email,

            senha: senhaCriptografada
        };

        dados.usuarios.push(novoUsuario);

        salvarDados(dados);

        const token =
            jwt.sign(
                {
                    id: novoUsuario.id,
                    nome: novoUsuario.nome,
                    email: novoUsuario.email
                },
                CHAVE_SECRETA,
                {
                    expiresIn: "2h"
                }
            );

        res.status(201).json({

            mensagem:
                "Usuário cadastrado com sucesso!",

            token,

            usuario: {

                id: novoUsuario.id,

                nome: novoUsuario.nome,

                email: novoUsuario.email
            }
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao cadastrar usuário."
        });
    }
});

// ========================================
// LOGIN
// ========================================

app.post("/login", async (req, res) => {

    try {

        const email =
            String(req.body.email || "")
                .trim()
                .toLowerCase();

        const senha =
            String(req.body.senha || "");

        if (!email || !senha) {

            return res.status(400).json({
                erro: "Informe e-mail e senha."
            });
        }

        const dados = lerDados();

        const usuario =
            dados.usuarios.find(
                usuario =>
                    String(usuario.email)
                        .toLowerCase() === email
            );

        if (!usuario) {

            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        const senhaCorreta =
            await bcrypt.compare(
                senha,
                usuario.senha
            );

        if (!senhaCorreta) {

            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        const token =
            jwt.sign(
                {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email
                },
                CHAVE_SECRETA,
                {
                    expiresIn: "2h"
                }
            );

        res.json({

            mensagem:
                "Login realizado com sucesso!",

            token,

            usuario: {

                id: usuario.id,

                nome: usuario.nome,

                email: usuario.email
            }
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao realizar login."
        });
    }
});

// ========================================
// CADASTRAR PEÇA
// ========================================

app.post(
    "/pecas",
    verificarToken,
    (req, res) => {

        try {

            const nome =
                String(req.body.nome || "")
                    .trim();

            const categoria =
                String(req.body.categoria || "")
                    .trim();

            const marca =
                String(req.body.marca || "")
                    .trim();

            const modelo =
                String(req.body.modelo || "")
                    .trim();

            const precoTexto =
                String(
                    req.body.preco ?? ""
                ).replace(",", ".");

            const estoqueTexto =
                String(
                    req.body.estoque ?? ""
                );

            if (
                !nome ||
                !categoria ||
                !marca ||
                !modelo ||
                precoTexto === "" ||
                estoqueTexto === ""
            ) {

                return res.status(400).json({
                    erro: "Preencha todos os campos da peça."
                });
            }

            const preco =
                Number(precoTexto);

            const estoque =
                Number(estoqueTexto);

            if (
                !Number.isFinite(preco) ||
                preco < 0
            ) {

                return res.status(400).json({
                    erro: "Informe um preço válido."
                });
            }

            if (
                !Number.isInteger(estoque) ||
                estoque < 0
            ) {

                return res.status(400).json({
                    erro: "Informe um estoque válido."
                });
            }

            const dados = lerDados();

            const novaPeca = {

                id: Date.now(),

                nome,

                categoria,

                marca,

                modelo,

                preco:
                    Number(preco.toFixed(2)),

                estoque
            };

            dados.pecas.push(novaPeca);

            salvarDados(dados);

            res.status(201).json({

                mensagem:
                    "Peça cadastrada com sucesso!",

                peca: novaPeca
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro: "Erro ao cadastrar peça."
            });
        }
    }
);

// ========================================
// LISTAR PEÇAS
// ========================================

app.get(
    "/pecas",
    verificarToken,
    (req, res) => {

        try {

            const dados = lerDados();

            res.json(dados.pecas);

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro: "Erro ao carregar peças."
            });
        }
    }
);

// ========================================
// BUSCAR PEÇAS
// ========================================

app.get(
    "/pecas/buscar",
    verificarToken,
    (req, res) => {

        try {

            const termo =
                String(
                    req.query.termo || ""
                )
                    .trim()
                    .toLowerCase();

            const dados = lerDados();

            if (!termo) {

                return res.json(
                    dados.pecas
                );
            }

            const resultado =
                dados.pecas.filter(peca => {

                    return (

                        String(peca.nome)
                            .toLowerCase()
                            .includes(termo)

                        ||

                        String(peca.categoria)
                            .toLowerCase()
                            .includes(termo)

                        ||

                        String(peca.marca)
                            .toLowerCase()
                            .includes(termo)

                        ||

                        String(peca.modelo)
                            .toLowerCase()
                            .includes(termo)
                    );
                });

            res.json(resultado);

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro: "Erro ao buscar peças."
            });
        }
    }
);

// ========================================
// EXCLUIR PEÇA
// ========================================

app.delete(
    "/pecas/:id",
    verificarToken,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const dados = lerDados();

            const quantidadeAntes =
                dados.pecas.length;

            dados.pecas =
                dados.pecas.filter(
                    peca =>
                        Number(peca.id) !== id
                );

            if (
                dados.pecas.length ===
                quantidadeAntes
            ) {

                return res.status(404).json({
                    erro: "Peça não encontrada."
                });
            }

            salvarDados(dados);

            res.json({
                mensagem:
                    "Peça excluída com sucesso!"
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro: "Erro ao excluir peça."
            });
        }
    }
);

// ========================================
// USUÁRIO LOGADO
// ========================================

app.get(
    "/me",
    verificarToken,
    (req, res) => {

        res.json({
            usuario: req.usuario
        });
    }
);

// ========================================
// ROTA NÃO ENCONTRADA
// ========================================

app.use((req, res) => {

    res.status(404).json({
        erro: "Rota não encontrada."
    });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

criarBanco();

app.listen(PORT, () => {

    console.log("");
    console.log("================================");
    console.log("          🖥️ PC STORE");
    console.log("================================");
    console.log("");
    console.log(
        `Servidor: http://localhost:${PORT}`
    );
    console.log(
        `Teste API: http://localhost:${PORT}/api`
    );
    console.log("");
    console.log("Servidor funcionando!");
    console.log("");
});