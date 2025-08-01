# 📧 Configuração do EmailJS para 5º Vigia

O website agora está configurado para enviar emails automaticamente através do serviço EmailJS. Para ativar esta funcionalidade, precisa seguir estes passos:

## 1. Criar Conta no EmailJS

1. Vá para: **https://www.emailjs.com/**
2. Clique em **"Sign Up"** para criar uma conta gratuita
3. Confirme o seu email e faça login

## 2. Configurar Serviço de Email

1. No painel do EmailJS, vá para **"Email Services"**
2. Clique em **"Add New Service"**
3. Escolha o seu provedor de email (Gmail, Outlook, etc.)
4. Siga as instruções para conectar a sua conta de email
5. **Anote o Service ID** (exemplo: `service_abc123`)

## 3. Criar Template de Email

1. Vá para **"Email Templates"**
2. Clique em **"Create New Template"**
3. Configure o template com os seguintes campos:

### Template de Email:
```
Assunto: Novo Pedido de Reserva - {{accommodation}}

Para: antoniojclourenco@gmail.com

Corpo do Email:
===================================
NOVO PEDIDO DE RESERVA - 5º VIGIA
===================================

DADOS DO CLIENTE:
📧 Nome: {{from_name}}
📧 Email: {{from_email}}
📞 Telefone: {{phone}}

DETALHES DA RESERVA:
🏠 Alojamento: {{accommodation}}
📅 Datas Pretendidas: {{dates}}

MENSAGEM:
{{message}}

---
Este pedido foi enviado automaticamente através do website 5º Vigia.
Para responder, use o email: {{from_email}}
```

4. **Anote o Template ID** (exemplo: `template_xyz789`)

## 4. Obter Public Key

1. Vá para **"Account"** → **"General"**
2. Encontre a **"Public Key"**
3. **Anote a Public Key** (exemplo: `user_abcdefg123`)

## 5. Atualizar o Website

Edite o arquivo `script.js` e substitua os valores placeholder:

```javascript
// Configuração EmailJS
const app = {
    emailjs: {
        serviceId: 'SEU_SERVICE_ID_AQUI',      // ← Substituir
        templateId: 'SEU_TEMPLATE_ID_AQUI',    // ← Substituir
        publicKey: 'SUA_PUBLIC_KEY_AQUI'       // ← Substituir
    },
    // ... resto da configuração
};
```

## 6. Testar o Sistema

1. Abra o website no navegador
2. Preencha o formulário de contacto
3. Clique em "Enviar Pedido"
4. Verifique se recebe o email automaticamente

## 7. Limites da Conta Gratuita

- **200 emails/mês** (gratuito)
- Para mais emails, considere upgrade para plano pago
- Monitorize o uso no painel do EmailJS

## 8. Fallback System

O website tem um sistema de backup:
- Se o EmailJS falhar, automaticamente usa o sistema mailto
- Garante que nunca perde pedidos de reserva

## 9. Suporte Técnico

Se tiver problemas:
1. Verifique a consola do navegador (F12) por erros
2. Confirme que os IDs estão corretos no `script.js`
3. Teste o template diretamente no painel do EmailJS

---

## ✅ Checklist Final

- [ ] Conta EmailJS criada
- [ ] Serviço de email configurado
- [ ] Template criado com campos corretos
- [ ] IDs atualizados no script.js
- [ ] Teste realizado com sucesso
- [ ] Emails a chegar corretamente

**Após completar todos os passos, o sistema de email automático estará funcionando!**
