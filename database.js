// database.js
import 'dotenv/config'; // Garante que o Node carregue a sua DATABASE_URL do arquivo .env
import pkgClient from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';


const { PrismaClient } = pkgClient;


// 1. Cria a piscina de conexões (Pool) usando o driver nativo do PostgreSQL
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });


// 2. Cria o adaptador do Prisma para envelopar esse driver
const adapter = new PrismaPg(pool);


// 3. Instancia o Prisma Client passando o adaptador exigido pelo Prisma 7
const prisma = new PrismaClient({ adapter });


export default prisma;