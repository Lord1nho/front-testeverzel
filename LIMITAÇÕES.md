# Limitações e Possibilidades de Melhorias — Front-End

Além das limitações identificadas no funcionamento da aplicação, existem alguns pontos de interface e experiência de uso que podem ser aprimorados em versões futuras.

## 1. Exclusão de Múltiplos Eventos

Atualmente, a exclusão de eventos é realizada individualmente.

Como melhoria, poderia ser implementada a possibilidade de **selecionar múltiplos eventos e excluí-los em uma única ação**, facilitando o gerenciamento do catálogo pelo organizador.

## 2. Criação de Múltiplas Sessões para o Mesmo Filme

Atualmente, a criação de eventos é realizada individualmente.

Como melhoria, poderia ser implementada a possibilidade de **criar múltiplos horários/sessões para um mesmo filme em uma única operação**, evitando a necessidade de cadastrar cada sessão separadamente.

## 3. Filtragem de Eventos

Poderia ser aprimorado o sistema de **filtragem de eventos** tanto na área do organizador quanto na área do cliente.

Entre as possibilidades estão filtros por:

* Data;
* Local;
* Preço;
* Tipo de evento;
* Disponibilidade de ingressos;
* Status do evento.

Na área do organizador, filtros adicionais relacionados ao **status e gerenciamento dos eventos** poderiam facilitar a localização e administração dos registros.

## 4. Relatórios por Sessão

Como melhoria para a área do organizador, poderia ser implementada uma **tela de relatórios gerais para cada sessão**, permitindo acompanhar de forma consolidada os principais indicadores do evento.

Entre as informações que poderiam ser apresentadas:

* Total de ingressos disponíveis;
* Total de ingressos reservados;
* Total de ingressos vendidos;
* Quantidade de ingressos utilizados na portaria;
* Quantidade de ingressos ainda não utilizados;
* Receita da sessão;
* Taxa de ocupação;
* Status da sessão.

Essa funcionalidade permitiria ao organizador acompanhar o desempenho de cada sessão de forma mais clara e centralizada.

## 5. Paginação de Eventos

Como possibilidade de melhoria, pode ser implementada uma estratégia de paginação para os eventos exibidos na aplicação, contemplando tanto os eventos provenientes da API do TMDB quanto os eventos já publicados na plataforma.

A paginação permitiria:

Carregar os eventos do TMDB de forma incremental;
Evitar o carregamento de uma grande quantidade de registros em uma única requisição;
Facilitar a navegação entre diferentes páginas de eventos publicados;
Melhorar o desempenho e a experiência do usuário em catálogos maiores.
