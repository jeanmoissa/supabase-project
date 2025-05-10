require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Cria a instância do Express
const app = express();
const port = process.env.PORT || 3000;

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Management API',
      version: '1.0.0',
      description: 'API para gerenciamento de usuários',
      contact: {
        name: 'Seu Nome',
        email: 'seu@email.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento'
      }
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              example: 'João Silva'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'joao@example.com'
            },
            age: {
              type: 'integer',
              example: 30
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Mensagem de erro'
            }
          }
        }
      }
    }
  },
  apis: ['./index.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


/* ROTAS */

/**
 * @route POST /users
 * @description Cria um novo usuário
 * @access Public
 * @openapi
 * /users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Cria um novo usuário
 *     description: Cadastra um novo usuário no sistema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 example: joao@example.com
 *               age:
 *                 type: integer
 *                 example: 30
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro no servidor
 */
const { validateUser } = require('./validators/userValidator');

app.post('/users', async (req, res) => {
  try {
    const { error } = validateUser(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /users
 * @description Lista todos os usuários
 * @access Public
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Lista todos os usuários
 *     description: Retorna uma lista com todos os usuários cadastrados
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Erro no servidor
 */ 
app.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /users/:id
 * @description Obtém um usuário pelo ID
 * @access Public
 * @openapi
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Obtém um usuário pelo ID
 *     description: Retorna os detalhes de um usuário específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Detalhes do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro no servidor
 */
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route PUT /users/:id
 * @description Atualiza um usuário pelo ID
 * @access Public
 * @openapi
 * /users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Atualiza um usuário
 *     description: Atualiza os dados de um usuário existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: João Silva Atualizado
 *               email:
 *                 type: string
 *                 format: email
 *                 example: joao.novo@example.com
 *               age:
 *                 type: integer
 *                 example: 31
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro no servidor
 */
app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, age } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ name, email, age, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.status(200).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route DELETE /users/:id
 * @description Remove um usuário pelo ID
 * @access Public
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Remove um usuário
 *     description: Deleta um usuário do sistema
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro no servidor
 */
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.status(200).json({ message: 'Usuário deletado com sucesso', user: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ROTA ESQUECER SENHA */

const { sendPasswordResetEmail } = require('./services/emailService');
const crypto = require('crypto');

/**
 * @route POST /forgot-password
 * @description Solicita redefinição de senha
 * @access Public
 *  @openapi
 * /forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Solicita redefinição de senha
 *     description: Envia um e-mail com link para redefinir a senha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@example.com
 *     responses:
 *       200:
 *         description: E-mail enviado (se o endereço existir)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Se o email existir, um link de redefinição foi enviado
 *       400:
 *         description: E-mail não fornecido
 *       500:
 *         description: Erro no servidor
 */
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Para segurança, não revelamos se o email existe ou não
      return res.status(200).json({ message: 'Se o email existir, um link de redefinição foi enviado' });
    }

    // Gerar token e data de expiração
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hora

    // Atualizar usuário com token e expiração
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_reset_token: token,
        password_reset_expires: expires.toISOString()
      })
      .eq('email', email);

    if (updateError) throw updateError;

    // Enviar email
    await sendPasswordResetEmail(email, token);

    res.status(200).json({ message: 'Se o email existir, um link de redefinição foi enviado' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação de redefinição de senha' });
  }
});

/**
 * @route POST /reset-password
 * @description Redefine a senha do usuário
 * @access Public
 * @openapi
 * /reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Redefine a senha do usuário
 *     description: Permite definir uma nova senha usando um token válido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token recebido por e-mail
 *                 example: abc123def456ghi789
 *               password:
 *                 type: string
 *                 description: Nova senha
 *                 example: novaSenhaSegura123
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Senha redefinida com sucesso
 *       400:
 *         description: Token inválido ou expirado
 *       500:
 *         description: Erro no servidor
 */
app.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    // Verificar token e expiração
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('password_reset_token', token)
      .gt('password_reset_expires', new Date().toISOString())
      .single();

    if (userError || !user) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Atualizar senha e limpar token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: password, // Na prática, você deve hash esta senha
        password_reset_token: null,
        password_reset_expires: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    res.status(200).json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});


/* DOCUMENTAÇÃO SWAGGER OLD */
/*
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Management API',
      version: '1.0.0',
      description: 'API para gerenciamento de usuários',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./index.js'], // arquivos onde estão as rotas
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
*/
