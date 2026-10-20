# Painel de Atendimentos SAU-STI 📊

Dashboard moderno, interativo e de alta performance desenvolvido com design **Glassmorphism Dark** para análise exploratória, métricas de desempenho (KPIs) e monitoramento de chamados técnicos do SAU (Serviço de Atendimento ao Usuário) / STI.

---

## 🚀 Funcionalidades

- **Métricas e Indicadores em Tempo Real (KPIs)**:
  - Total de Chamados filtrados
  - Chamados Resolvidos
  - Tempo Médio de Resolução (dias)
  - Chamados Pendentes
- **Filtro Avançado de Tempo por Período**:
  - Seleção por data inicial e final (`<input type="date">` com tema escuro adaptado).
  - Atalhos rápidos com 1 clique: *Todo o período*, *Últimos 30 dias*, *Últimos 90 dias*, *Ano 2026*, *Ano 2025*, *Ano 2024*.
  - Indicador dinâmico de status do período selecionado e contagem de chamados.
  - Gráfico de linha temporal com agregação inteligente (visão diária para períodos curtos ou mensal para períodos longos).
- **Filtros Adicionais**:
  - Busca textual em tempo real (número do chamado, solicitante, e-mail, descrição).
  - Categoria (Objeto).
  - Solucionador técnico.
  - Situação/Status do chamado.
  - Botão de limpeza rápida de filtros.
- **Gráficos Interativos (Chart.js)**:
  - Distribuição de Chamados por Categoria (Barras horizontais).
  - Linha do tempo de abertura de chamados.
  - Ranking dos Principais Solucionadores.
  - Distribuição percentual por Status (Doughnut chart).
- **Tabela de Dados Paginada**:
  - Exibição limpa com paginação dinâmica.
  - Modal/Drawer lateral com detalhes completos do chamado ao clicar na linha (descrição do problema, contatos, datas e tempos).
- **Design & Experiência**:
  - Interface responsiva com efeitos de vidro (*glassmorphism*), gradientes suaves e microanimações.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5** & **CSS3** (Variáveis CSS, Flexbox/Grid, Glassmorphism, temas modernos).
- **JavaScript ES6+** (Manipulação de dados, paginação, filtros e eventos dinâmicos).
- **Chart.js** (Renderização de gráficos vetoriais interativos).
- **FontAwesome** (Ícones da interface).

---

## 💻 Como Executar Localmente

### Opção 1: Com XAMPP / Apache
1. Clone ou mova este repositório para o diretório `htdocs` do seu XAMPP:
   ```bash
   cd c:\xampp\htdocs\dashboards\
   git clone https://github.com/dominguesrds29-code/relatorio-sau-ssti.git SAU-STI
   ```
2. Inicie o serviço **Apache** no painel de controle do XAMPP.
3. Abra seu navegador em:
   ```
   http://localhost/dashboards/SAU-STI/
   ```

### Opção 2: Com qualquer servidor HTTP local
Se preferir usar Python, Node.js ou a extensão Live Server do VS Code:
```bash
# Com Python 3
python -m http.server 8000

# Com Node (npx)
npx serve .
```
E acesse `http://localhost:8000`.

---

## 📄 Estrutura de Arquivos

```
SAU-STI/
├── index.html                  # Estrutura principal do painel e componentes
├── style.css                   # Folha de estilos, layout e tokens visuais
├── app.js                      # Lógica de negócio, carregamento, gráficos e filtros
├── data.json                   # Base de dados estruturada dos chamados
├── chamadosExportadosSAU.csv   # Dados brutos exportados do sistema SAU
├── chamadosExportadosSAU.xls   # Planilha de exportação
└── README.md                   # Documentação do projeto
```

---

Desenvolvido para apoio operacional e governança de TI.
