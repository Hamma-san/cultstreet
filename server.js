const path = require("path");
const crypto = require("crypto");
const express = require("express");
const dotenv = require("dotenv");
const { MercadoPagoConfig, Preference } = require("mercadopago");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const baseUrl = (process.env.APP_BASE_URL || `http://localhost:${port}`).replace(/\/+$/, "");
const shippingCost = 24.9;

const catalog = {
    "essential-001": { name: "ESSENTIAL 001", price: 129.9, stock: 34 },
    "essential-002": { name: "ESSENTIAL 002", price: 149.9, stock: 28 },
    "essential-003": { name: "ESSENTIAL 003", price: 159.9, stock: 19 },
    "black-001": { name: "BLACK 001", price: 299.9, stock: 12 },
    "black-002": { name: "BLACK 002", price: 399.9, stock: 8 },
    "black-003": { name: "BLACK 003", price: 499.9, stock: 5 }
};

const validSizes = new Set(["P", "M", "G", "GG"]);

app.use(express.json({ limit: "20kb" }));
app.use(express.static(__dirname));

app.post("/create-preference", async (req, res) => {
    try {
        if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
            return res.status(500).json({ error: "Credencial do Mercado Pago não configurada." });
        }

        const receivedItems = Array.isArray(req.body.items) ? req.body.items : [];
        if (!receivedItems.length || receivedItems.length > 20) {
            return res.status(400).json({ error: "Carrinho inválido." });
        }

        const groupedItems = new Map();
        receivedItems.forEach((item) => {
            const key = `${item.id}:${item.size}`;
            const quantity = Number(item.quantity);
            groupedItems.set(key, {
                id: item.id,
                size: item.size,
                quantity: (groupedItems.get(key)?.quantity || 0) + quantity
            });
        });

        const quantityByProduct = new Map();
        groupedItems.forEach((item) => {
            quantityByProduct.set(
                item.id,
                (quantityByProduct.get(item.id) || 0) + item.quantity
            );
        });

        const validatedItems = [...groupedItems.values()].map((item) => {
            const product = catalog[item.id];
            const quantity = Number(item.quantity);

            if (
                !product ||
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantityByProduct.get(item.id) > product.stock
            ) {
                throw new Error("Produto ou quantidade inválida.");
            }

            if (!validSizes.has(item.size)) {
                throw new Error("Tamanho inválido.");
            }

            return {
                id: item.id,
                title: `${product.name} - Tamanho ${item.size}`,
                quantity,
                currency_id: "BRL",
                unit_price: product.price
            };
        });

        const subtotal = validatedItems.reduce(
            (sum, item) => sum + item.unit_price * item.quantity,
            0
        );

        const preferenceItems = [
            ...validatedItems,
            {
                id: "shipping",
                title: "Frete CULT",
                quantity: 1,
                currency_id: "BRL",
                unit_price: shippingCost
            }
        ];

        const client = new MercadoPagoConfig({
