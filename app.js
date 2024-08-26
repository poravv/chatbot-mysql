const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
require('dotenv').config();
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MysqlAdapter = require('@bot-whatsapp/database/mysql')
const MockAdapter = require('@bot-whatsapp/database/mock')
const path = require('path')
const fs = require('fs')
const pool = require('./dbConfig');

const bienvenidaPath = path.join(__dirname, "mensajes", "Bienvenida.txt")
const bienvenida = fs.readFileSync(bienvenidaPath, 'utf-8');

const itemsPath = path.join(__dirname, "mensajes", "ItemsBienvenida.txt")
const ItemsBienvenida = fs.readFileSync(itemsPath, 'utf-8');

//---------------------------------------------------------------
let clienteInfo = {};
let pedido = [];
let itemProducto = '';
//---------------------------------------------------------------

const bienvenidaFlow = addKeyword(['hola', 'Hola', 'buenas', 'hello', 'holi', 'hole', 'buenos', '!consulta'])
    .addAnswer(bienvenida,
        { delay: 1000, }
    )
    .addAnswer(
        ItemsBienvenida,
        {
            capture: true,
            delay: 2000,
        },
        async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            if (!["a", "0"].includes(ctx.body.toLowerCase())) {
                return fallBack(
                    "Respuesta no válida, por favor selecciona una de las opciones."
                );
            }
            switch (ctx.body.toLowerCase()) {
                case "a":
                    return gotoFlow(flowCliente);
                case "0":
                    return await flowDynamic(
                        "Saliendo... Puedes volver a acceder a este chat escribiendo !consulta"
                    );
            }
        }
    );

const flowAgregarProducto = addKeyword([EVENTS.ACTION])
    .addAnswer('¿Quieres agregar otro producto? (sí/no)', { capture: true }, async (ctx, ctxFn) => {
        if (ctx.body.toLowerCase() === 'sí' || ctx.body.toLowerCase() === 'si') {
            await ctxFn.flowDynamic('Vamos a agregar otro producto.');
            return ctxFn.gotoFlow(flowProducto);
        } else {
            await ctxFn.flowDynamic('Gracias, tu pedido ha sido registrado.');
            console.log('Pedido completo:', pedido);
            // Guardar el pedido en la base de datos
            try {
                const connection = await pool.getConnection();
                const [result] = await connection.query('INSERT INTO pedido (cliente, ruc, estado) VALUES (?, ?, ?)', [clienteInfo.nombre, clienteInfo.ruc, 'pendiente']);
                const idpedido = result.insertId;

                for (const item of pedido) {
                    await connection.query('INSERT INTO det_pedido (producto, cantidad, idpedido) VALUES (?, ?, ?)', [item.producto, item.cantidad, idpedido]);
                }
                
                pedido=[];

                connection.release();
                console.log('Pedido guardado en la base de datos con éxito.');
            } catch (error) {
                console.error('Error al guardar el pedido en la base de datos:', error);
            }
        }
    });



const flowProducto = addKeyword([EVENTS.ACTION])
    .addAnswer('¿Cuál es el nombre del producto?', { capture: true }, async (ctx, ctxFn) => {
        //ctxFn.producto = ctx.body; // Guardamos el nombre del producto en el contexto
        itemProducto=ctx.body;
        return ctxFn.gotoFlow(flowCantidad);
    });


const flowRUC = addKeyword([EVENTS.ACTION])
    .addAnswer('¿Cuál es tu RUC?', { capture: true }, async (ctx, ctxFn) => {
        clienteInfo.ruc = ctx.body;
        return ctxFn.gotoFlow(flowProducto);
    });

const flowCliente = addKeyword([EVENTS.ACTION])
    .addAnswer('¿Podrías facilitarme tu nombre de cliente?', { capture: true }, async (ctx, ctxFn) => {
        clienteInfo.nombre = ctx.body;
        return ctxFn.gotoFlow(flowRUC);
    });

const flowCantidad = addKeyword([EVENTS.ACTION])
    .addAnswer('¿Cuál es la cantidad?', { capture: true }, async (ctx, ctxFn) => {
        const cantidad = ctx.body;
        pedido.push({ producto: itemProducto, cantidad });
        itemProducto='';
        return ctxFn.gotoFlow(flowAgregarProducto);
    });

const main = async () => {
    /*
    const adapterDB = new MysqlAdapter({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT,
    })
    */
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([
        bienvenidaFlow,
        flowCliente,
        flowProducto,
        flowRUC,
        flowAgregarProducto,
        flowCantidad
    ])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
}

main()
