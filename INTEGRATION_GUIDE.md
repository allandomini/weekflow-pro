# Guia de Integração - Clockify e Plaky

## Visão Geral

Este sistema agora inclui duas novas funcionalidades integradas:

1. **Clockify** - Sistema de controle de tempo e projetos
2. **Plaky** - Sistema de quadros Kanban e gerenciamento de tarefas

## Clockify

### Funcionalidades Principais

- **Timer em Tempo Real**: Inicie e pare timers para tarefas específicas
- **Controle de Projetos**: Gerencie projetos com clientes e taxas por hora
- **Entradas de Tempo**: Registre tempo manualmente ou via timer
- **Sistema de Faturamento**: Controle de horas faturáveis e cálculo de valores
- **Gestão de Clientes**: Cadastro e controle de clientes

### Como Usar

1. **Timer Ativo**:
   - Digite a descrição da tarefa
   - Selecione o projeto (opcional)
   - Ative o modo faturável se necessário
   - Defina a taxa por hora
   - Clique em "Iniciar Timer"

2. **Projetos**:
   - Crie projetos com cores personalizadas
   - Associe clientes aos projetos
   - Defina taxas por hora padrão
   - Arquivar projetos quando necessário

3. **Clientes**:
   - Cadastre informações completas dos clientes
   - Defina taxas por hora padrão
   - Associe clientes aos projetos

### Integração com Sistema Existente

- Os projetos do Clockify podem ser vinculados aos projetos principais do sistema
- As entradas de tempo são salvas localmente e podem ser exportadas
- Sistema de tags para categorização de tarefas

## Plaky

### Funcionalidades Principais

- **Quadros Kanban**: Visualização em colunas para diferentes status
- **Colunas Personalizáveis**: Diferentes tipos de dados (texto, número, data, status, pessoa, dropdown)
- **Drag & Drop**: Mova itens entre colunas arrastando
- **Gestão de Itens**: Adicione, edite e remova itens facilmente
- **Colunas Padrão**: Sistema vem com colunas padrão (A Fazer, Em Progresso, Concluído)

### Como Usar

1. **Criar Quadro**:
   - Defina nome e descrição
   - Escolha cor personalizada
   - O sistema cria colunas padrão automaticamente

2. **Gerenciar Colunas**:
   - Adicione novas colunas com tipos específicos
   - Configure opções para colunas de dropdown/status
   - Reordene colunas conforme necessário

3. **Gerenciar Itens**:
   - Adicione itens diretamente nas colunas
   - Arraste itens entre colunas para mudar status
   - Visualize histórico de criação dos itens

### Integração com Sistema Existente

- Os quadros podem representar fluxos de trabalho dos projetos existentes
- Itens podem ser vinculados a tarefas e projetos do sistema principal
- Sistema de cores consistente com o tema da aplicação

## Estrutura de Dados

### Clockify

```typescript
interface ClockifyTimeEntry {
  id: string;
  description: string;
  projectId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // em segundos
  billable: boolean;
  hourlyRate?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ClockifyProject {
  id: string;
  name: string;
  description?: string;
  color: string;
  clientName?: string;
  hourlyRate?: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ClockifyClient {
  id: string;
  name: string;
  email?: string;
  address?: string;
  hourlyRate?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Plaky

```typescript
interface PlakyBoard {
  id: string;
  name: string;
  description?: string;
  color: string;
  columns: PlakyColumn[];
  createdAt: Date;
  updatedAt: Date;
}

interface PlakyColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'status' | 'person' | 'dropdown';
  options?: string[]; // para colunas dropdown/status
  order: number;
}

interface PlakyItem {
  id: string;
  boardId: string;
  values: Record<string, any>; // mapeamento columnId -> valor
  createdAt: Date;
  updatedAt: Date;
}
```

## Persistência de Dados

- Todos os dados são salvos no localStorage do navegador
- Sincronização automática entre abas
- Backup automático de todas as alterações

## Navegação

As novas funcionalidades estão acessíveis através do sidebar principal:

- **Clockify**: Ícone de relógio (Clock)
- **Plaky**: Ícone de quadro (Trello)

## Próximos Passos de Desenvolvimento

1. **Integração com API Externa**:
   - Sincronização com Clockify real via API
   - Sincronização com Plaky real via API

2. **Relatórios e Analytics**:
   - Relatórios de tempo por projeto/cliente
   - Métricas de produtividade
   - Exportação de dados

3. **Funcionalidades Avançadas**:
   - Sistema de notificações
   - Lembretes e deadlines
   - Integração com calendário
   - Sistema de permissões

## Suporte

Para dúvidas ou sugestões sobre as funcionalidades, consulte a documentação do código ou entre em contato com a equipe de desenvolvimento. 