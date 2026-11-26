# Acesso ao fatto-lab (Supabase Auth + RLS)

O login agora é por e-mail e senha do Supabase Auth. A senha fixa no código foi removida,
e os dados só carregam depois do login. Quem protege os dados de verdade é o RLS do banco:
sem ele, qualquer um com a chave publicável (que vai no site) lê e altera a tabela.

## Ordem (para ninguém ficar trancado para fora)

1. **Backup.** Table Editor > `produtos` > Export to CSV.
2. **Ver o que está liberado hoje** (SQL Editor):
   ```sql
   select policyname, roles, cmd, qual, with_check from pg_policies where tablename = 'produtos';
   select relrowsecurity from pg_class where oid = 'public.produtos'::regclass;
   ```
3. **Desligar cadastro público.** Authentication > Sign In / Providers > desmarcar
   "Allow new users to sign up". Assim só entra quem você criar.
4. **Criar os usuários.** Authentication > Users > Add user > Create new user
   (e-mail + senha, marcando "Auto Confirm User").
5. **Rodar `001_acesso_produtos.sql`** inteiro no SQL Editor e depois o `insert` do passo 4
   do arquivo, com os e-mails reais.
6. **Publicar o app** (push na `main` dispara o deploy no GitHub Pages).

Entre o passo 5 e o 6 o site antigo para de carregar dados, porque o anônimo perdeu acesso.
Faça os dois em sequência.

## Conferir

- Deslogado (ou na aba anônima), o app mostra só a tela de login.
- Logado com usuário em `membros`, a tabela carrega e salva.
- Logado com usuário fora de `membros`, a tabela vem vazia e salvar dá "Erro ao salvar".
- Teste direto da API, sem login: deve voltar `[]` ou erro de permissão.
  ```powershell
  curl.exe "https://tlvunnzgrawkolgrgucd.supabase.co/rest/v1/produtos?select=id&limit=1" -H "apikey: <chave publicável>"
  ```

## Função `makerworld` (análise por link)

O navegador não consegue chamar a API do MakerWorld direto (falta CORS), então o Simulador
passa pela Edge Function `supabase/functions/makerworld`. Ela só aceita usuário logado.

```powershell
npx supabase login
```
```powershell
npx supabase functions deploy makerworld --project-ref tlvunnzgrawkolgrgucd
```

Sem a função publicada o app continua funcionando: o Simulador mostra um "plano B" com o link
dos dados do modelo para copiar e colar.

## Observações

- A senha antiga continua no histórico do git e no site publicado até o novo deploy. Se ela
  for usada em qualquer outro lugar, troque lá.
- Para dar ou tirar acesso: inserir ou apagar a linha em `public.membros`.
