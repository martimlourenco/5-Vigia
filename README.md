# 5º Vigia - Alojamentos Locais

## Estrutura do Projeto

### Arquivos Criados:
- `index.html` - Página principal com design moderno e responsivo
- `styles.css` - Estilos CSS com design profissional
- `script.js` - JavaScript com todas as funcionalidades interativas
- `imagens/` - Pasta para as fotografias dos alojamentos
  - `alojamento1/` - 30 fotos da Casa do Vigia (1.jpg até 30.jpg) ✅ **ADICIONADAS**
  - `alojamento2/` - 30 fotos do Cântigo das Quintas (1.jpg até 30.jpg) ✅ **ADICIONADAS**
  - `exemplo.png` - Imagem de exemplo (opcional para fallback)

## Funcionalidades Implementadas:

### 🏠 **Apresentação dos Alojamentos**
- Design moderno e profissional
- Cards interativos para cada alojamento
- Informações detalhadas e características

### 📅 **Sistema de Calendário**
- Calendários independentes para cada alojamento
- **Integração iCal com Booking.com** (mais simples que API)
- Datas ocupadas marcadas automaticamente
- Seleção múltipla de datas para contacto
- Atualização automática a cada 5 minutos
- **Apenas visualização** (sem reservas diretas)

### 🖼️ **Galeria de Fotos**
- Galeria responsiva para 30 fotos por alojamento ✅ **COMPLETA**
- Modal de visualização com **controles de zoom avançados**
- **Zoom com roda do rato** e botões dedicados
- **Arrastar imagens** quando com zoom
- Tabs separadas para cada propriedade
- Contador de fotos e navegação por teclado
- Otimização para diferentes tamanhos de tela

### 📧 **Sistema de Contacto**
- Formulário inteligente com auto-preenchimento
- Integração com cliente de email
- Datas selecionadas transferidas automaticamente
- Validação de formulário

### 🎨 **Design e UX**
- Loading screen animado
- Navegação suave entre seções
- Efeitos de hover e transições
- Design totalmente responsivo
- Esquema de cores profissional

## Como Personalizar:

### 1. **Adicionar Fotos**
✅ **TODAS AS FOTOS JÁ ADICIONADAS!**
- `imagens/alojamento1/1.jpg` até `30.jpg` (Casa do Vigia) ✅
- `imagens/alojamento2/1.jpg` até `30.jpg` (Cântigo das Quintas) ✅
- `imagens/exemplo.png` (opcional para fallback)

### 2. **Configurar Integração com Booking via iCal**
No arquivo `script.js`, substitua os URLs iCal pelos do seu Booking:
```javascript
// URLs iCal do Booking.com (encontre em: Extranet > Conectividade > Sincronização de calendário)
const icalUrls = {
    alojamento1: 'https://admin.booking.com/hotel/hoteladmin/ical.html?ses=...&hotel_id=...&room_id=...',
    alojamento2: 'https://admin.booking.com/hotel/hoteladmin/ical.html?ses=...&hotel_id=...&room_id=...'
};
```

**Como obter os URLs iCal do Booking:**
1. Aceda à Extranet do Booking.com
2. Vá a "Conectividade" > "Sincronização de calendário"
3. Copie o URL do calendário iCal para cada propriedade

**Vantagens do iCal vs API:**
- ✅ **Mais simples** - Não precisa de autenticação complexa
- ✅ **Gratuito** - Sem custos de API
- ✅ **Automático** - Atualiza sempre que há reservas
- ✅ **Padrão** - Funciona com qualquer plataforma (Booking, Airbnb, etc.)
- ✅ **Sem reservas** - Ideal para mostrar apenas disponibilidade

**Nota sobre CORS:** Para produção, pode precisar de um proxy simples no servidor para evitar problemas de CORS.

### 3. **Personalizar Informações**
- Edite os textos no `index.html`
- Ajuste cores no `styles.css` (variáveis CSS no topo)
- Configure email de contacto

### 4. **Configurar Domínio e Hospedagem**
O site está pronto para ser hospedado em qualquer servidor web.

## Tecnologias Utilizadas:
- HTML5 semântico
- CSS3 com Grid e Flexbox
- JavaScript ES6+
- Font Awesome para ícones
- Google Fonts (Playfair Display + Inter)

## Características Técnicas:
- ✅ Totalmente responsivo
- ✅ SEO otimizado
- ✅ Performance otimizada
- ✅ Acessibilidade (WCAG)
- ✅ Cross-browser compatible
- ✅ PWA ready

## Próximos Passos:
1. ✅ **CONCLUÍDO** - Todas as 60 fotografias adicionadas
2. ✅ **CONCLUÍDO** - Problemas de zoom e pixelização resolvidos
3. Configurar integração real com Booking.com (URLs iCal)
4. Testar em diferentes dispositivos
5. Configurar hospedagem e domínio
6. Implementar analytics (Google Analytics)

---

**Nota**: Coloque a imagem `exemplo.png` na pasta `imagens/` para servir como fallback enquanto adiciona as fotos reais dos alojamentos.
