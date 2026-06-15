# CultStreet + Mercado Pago Checkout Pro

## Requisitos

- Node.js 18 ou superior
- Credencial de teste ou produção do Mercado Pago

## Executar localmente

1. Abra o terminal nesta pasta.
2. Instale as dependências:

   `npm install`

3. Edite o arquivo `.env` e substitua `COLE_SEU_ACCESS_TOKEN_AQUI` pelo Access Token do Mercado Pago.
4. Inicie o servidor:

   `npm start`

5. Abra `http://localhost:3000`.

Não abra os arquivos pelo protocolo `file://`: o checkout depende da rota backend `/create-preference`.

## Segurança

O frontend envia somente IDs, tamanhos e quantidades. O servidor valida os produtos e recalcula preços, frete e total usando seu próprio catálogo.

Para produção, configure `APP_BASE_URL` com uma URL HTTPS pública. Também implemente webhooks e confirme o pagamento pela API do Mercado Pago antes de separar ou enviar um pedido. A página `success.html` sozinha não comprova pagamento.

O Checkout Pro apresenta PIX, cartão e boleto conforme a disponibilidade da conta e das regras do Mercado Pago.



