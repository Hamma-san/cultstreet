const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const seedProducts = [
    ["essential-001", "ESSENTIAL 001", "Essential", "Oversized 24.1 | Algodão Premium", "Camiseta essencial com algodão 24.1, toque macio, gola reforçada e modelagem oversized.", 129.9, 34, "images/essential-001.svg"],
    ["essential-002", "ESSENTIAL 002", "Essential", "Minimal Black Collection", "Peça minimalista para uso diário, com acabamento limpo e identidade urbana.", 149.9, 28, "images/essential-002.svg"],
    ["essential-003", "ESSENTIAL 003", "Essential", "Oversized Neutral Drop", "Base premium em tom neutro, feita para compor qualquer uniforme urbano.", 159.9, 19, "images/essential-003.svg"],
    ["black-001", "BLACK 001", "Black Label", "Heavyweight 280g | Limited", "Não é apenas uma camiseta. É um fragmento da cultura. Produção de apenas 100 unidades numeradas.", 299.9, 12, "images/black-001.svg"],
    ["black-002", "BLACK 002", "Black Label", "Premium Drop", "Heavyweight 280g com detalhes tonais, caimento estruturado e acabamento superior.", 399.9, 8, "images/black-002.svg"],
    ["black-003", "BLACK 003", "Black Label", "Edition Numbered Jacket", "Jaqueta limitada com construção premium, etiqueta numerada e presença de coleção.", 499.9, 5, "images/black-003.svg"]
];

const defaultContent = {
    hero_eyebrow: "Streetwear Social Premium",
    hero_title: "NÃO É SÓ ROUPA.\nÉ CULTURA.",
    hero_description: "Uma grife brasileira para quem veste identidade, comunidade e propósito.",
    manifesto_title: "Não seguimos tendências.\nCriamos nossa própria cultura.",
    manifesto_text: "A CultStreet nasce das ruas, das histórias e das pessoas. Cada peça é um capítulo de uma coleção limitada, criada para transformar roupa em símbolo de identidade."
};

let pool;

function getPool() {
    if (!process.env.DATABASE_URL) return null;
    if (!pool) {
        const isInternal = process.env.DATABASE_URL.includes(".internal");
        pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: isInternal ? false : { rejectUnauthorized: false } });
    }
    return pool;
}

async function initializeDatabase() {
    const db = getPool();
    if (!db) { console.warn("DATABASE_URL ausente: contas e painel administrativo estão desativados."); return false; }
    await db.query(`
        CREATE TABLE IF NOT EXISTS users (id BIGSERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(180) UNIQUE NOT NULL, password_hash TEXT NOT NULL, phone VARCHAR(30) DEFAULT '', role VARCHAR(20) NOT NULL DEFAULT 'customer', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
        CREATE TABLE IF NOT EXISTS products (id VARCHAR(60) PRIMARY KEY, name VARCHAR(120) NOT NULL, line VARCHAR(40) NOT NULL, description VARCHAR(240) NOT NULL, details TEXT NOT NULL, price NUMERIC(10, 2) NOT NULL CHECK (price >= 0), remaining INTEGER NOT NULL DEFAULT 0 CHECK (remaining >= 0), image TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
        CREATE TABLE IF NOT EXISTS site_content (key VARCHAR(80) PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    `);
    for (const product of seedProducts) await db.query(`INSERT INTO products (id,name,line,description,details,price,remaining,image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`, product);
    for (const [key,value] of Object.entries(defaultContent)) await db.query(`INSERT INTO site_content (key,value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING`, [key,value]);
    const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = String(process.env.ADMIN_PASSWORD || "");
    if (adminEmail && adminPassword.length >= 8) {
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        await db.query(`INSERT INTO users (name,email,password_hash,role) VALUES ('Administrador CultStreet',$1,$2,'admin') ON CONFLICT (email) DO UPDATE SET role='admin', password_hash=EXCLUDED.password_hash`, [adminEmail,passwordHash]);
    }
    return true;
}

async function listProducts(includeInactive=false) {
    const db=getPool();
    if(!db) return seedProducts.map(([id,name,line,description,details,price,remaining,image])=>({id,name,line,description,details,price,remaining,image,active:true}));
    const result=await db.query(`SELECT id,name,line,description,details,price::float,remaining,image,active FROM products ${includeInactive?"":"WHERE active=TRUE"} ORDER BY line DESC,id`);
    return result.rows;
}
async function getProduct(id){return (await listProducts(true)).find(product=>product.id===id);}
module.exports={defaultContent,getPool,getProduct,initializeDatabase,listProducts};
