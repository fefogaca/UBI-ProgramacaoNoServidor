# GREENHERB · Template LaTeX para Relatório de Projeto

Este template fornece a estrutura base para o relatório do projeto
GREENHERB. Está pronto para ser carregado no Overleaf ou usado
localmente com qualquer distribuição LaTeX recente.

## Como começar no Overleaf

1. No Overleaf, escolham **New Project → Upload Project**.
2. Comprimam toda a pasta deste template num `.zip` e façam *upload*.
3. No menu **Compiler**, garantam que está selecionado **pdfLaTeX**.
4. No menu de configurações do projeto, selecionem **Biber** como
   *bibliography compiler* (necessário para o pacote `biblatex`).
5. Cliquem em **Recompile**.

## Estrutura dos ficheiros

```
.
├── main.tex                    # Ficheiro principal (NÃO mexer, exceto inclusões)
├── bibliografia.bib            # Referências em formato BibTeX
├── config/
│   ├── identidade.tex          # Autores, instituição, datas — EDITAR
│   ├── capa.tex                # Layout da capa
│   └── resumo.tex              # Texto do resumo
├── capitulos/
│   ├── 01-introducao.tex
│   ├── 02-requisitos.tex
│   ├── 03-arquitetura.tex
│   ├── 04-conclusao.tex
│   └── anexos.tex
└── img/                        # Colocar aqui as imagens (PDF, PNG, JPG)
```

## O que editar primeiro

1. **`config/identidade.tex`** — preencher nomes, números, docente, etc.
2. **`config/resumo.tex`** — escrever o resumo (150–250 palavras) no fim.
3. **`capitulos/`** — substituir o texto-guia (entre parêntesis retos) pelo conteúdo do projeto.
4. **`bibliografia.bib`** — adicionar/remover referências conforme necessário.

## Dicas práticas

- **Não apaguem os blocos de instruções** enquanto estão a escrever — só na versão final. Servem como guião.
- **Imagens**: coloquem-nas em `img/` e usem `\includegraphics[width=0.8\linewidth]{img/nome.pdf}`.
- **Caixas destacadas** disponíveis: `decisao`, `nota` e `aviso`. Ver exemplos no Capítulo 3.
- **Diagramas em TikZ**: o diagrama de arquitetura geral (Capítulo 3) é editável diretamente no `.tex`. Para diagramas complexos, considerem `draw.io` exportado para PDF.
- **Citações**: usar `\cite{chave}` para citar uma entrada do `bibliografia.bib`.

## Erros comuns

| Sintoma | Causa provável |
|---|---|
| `! Package biblatex Error: Incompatible package 'babel'` | Compilador errado — usar pdfLaTeX, não LaTeX simples. |
| Bibliografia vazia | Falta correr Biber. No Overleaf, recompilar duas vezes. |
| Imagem não aparece | Caminho errado ou ficheiro fora de `img/`. |
| Acentos partidos | Confirmar que o ficheiro está em UTF-8. |

## Compilação local (alternativa ao Overleaf)

Com `texlive-full` (Linux) ou MiKTeX (Windows):

```bash
pdflatex main.tex
biber main
pdflatex main.tex
pdflatex main.tex
```

A última passagem garante que todas as referências cruzadas
(`\ref`, `\cite`, índice, etc.) ficam resolvidas.
