const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
require('dotenv').config();
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
//const MysqlAdapter = require('@bot-whatsapp/database/mysql')
const MockAdapter = require('@bot-whatsapp/database/mock')
//const path = require('path')
//const fs = require('fs')
const pool = require('./dbConfig');

//const bienvenidaPath = path.join(__dirname, "mensajes", "Bienvenida.txt")
//const bienvenida = fs.readFileSync(bienvenidaPath, 'utf-8');

//const itemsPath = path.join(__dirname, "mensajes", "ItemsBienvenida.txt")
//const ItemsBienvenida = fs.readFileSync(itemsPath, 'utf-8');

//---------------------------------------------------------------
let clienteInfo = {};
let pedido = [];
let itemProducto = '';
let idusuario = '595981586823';
//---------------------------------------------------------------

const bienvenidaFlow = addKeyword(['hola', 'Hola', 'Buenas', 'buenas', 'Buenos', 'buenos', 'pedido', 'Pedido', 'Consulta', 'consulta', '!consulta'])
    .addAnswer(
        `🟢 Gracias por comunicarte con Suitex py 🫱🏽‍🫲🏾`,
        { delay: 1000, }
    ).addAnswer(
        `🕥 Nuestro horario de atención son:
        Lunes a Viernes de 09:00 hs a 12:00 hs y 13:00 hs a 18:00 hs.`,
        { delay: 1000, }
    ).addAnswer(
        `🕥 Sabados de 09:00 hs a 12:00 hs y 13:00 hs a 18:00 hs.`,
        { delay: 1000, }
    ).addAnswer(
        `🕥 Domingos de 13:00 hs a 18:00 hs.`,
        { delay: 1000, }
    ).addAnswer(
        `En que podemos ayudarte?
         a) Solicitud de presupuesto.
         b) Quiero hacer una consulta.
         c) Necesito el catalogo.
         d) Quisiera el sitio web.
         e) Contactar con un vendedor.
         0) Salir de contestador.
        `,
        {
            capture: true,
            delay: 2000,
        },
        async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            if (!["a", "b", "c", "d", "e", "0"].includes(ctx.body.toLowerCase())) {
                return fallBack(
                    "🔴 Respuesta no válida, por favor selecciona una de las opciones."
                );
            }
            switch (ctx.body.toLowerCase()) {
                case "a":
                    return gotoFlow(flowCliente);
                case "b":
                    return gotoFlow(flowConsulta);
                case "c":
                    return gotoFlow(flowCatalogo);
                case "d":
                    return await flowDynamic(
                        `Nuestro sitio web es https://suitex.com.py/ 
                        Si necesitas mas mas informacion puedes escribir !consulta.
                        Muchas gracias`
                    );
                case "e":
                    return await flowDynamic(
                        `Puedes contactar con Isaias FernandesÑ 
                        https://wa.me/595993645127    
                        `
                    );
                case "0":
                    return await flowDynamic(
                        "Saliendo... Puedes volver a acceder a este chat escribiendo !consulta"
                    );
            }
        }
    );

const flowCatalogo = addKeyword(EVENTS.ACTION)
    .addAnswer('Puedes ingresar a nuestro sitio web https://suitex.com.py/ y la opción tienda, alli encontraras una variedad de prendas.', {
        //delay: 1000,
        //media: "https://imgv2-1-f.scribdassets.com/img/document/388490145/original/7e50eca805/1723633189?v=1"
    })

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
                const [result] = await connection.query('INSERT INTO pedido (cliente, ruc, idusuario, estado) VALUES (?, ?, ?, ?)', [clienteInfo.nombre, clienteInfo.ruc, idusuario, 'pendiente']);
                const idpedido = result.insertId;

                for (const item of pedido) {
                    await connection.query('INSERT INTO det_pedido (producto, cantidad, idpedido) VALUES (?, ?, ?)', [item.producto, item.cantidad, idpedido]);
                }

                pedido = [];

                connection.release();
                console.log('Pedido guardado en la base de datos con éxito.');
            } catch (error) {
                console.error('Error al guardar el pedido en la base de datos:', error);
            }
        }
    });

const flowConsulta = addKeyword([EVENTS.ACTION])
    .addAnswer('Podrias darme el detalle de tu consulta?', { capture: true }, async (ctx, ctxFn) => {
        //const consulta = ctx.body;
        await ctxFn.flowDynamic("Gracias, te respondere la duda en la brevedad posible")
        await ctxFn.flowDynamic("Saludos!")
    })

const flowProducto = addKeyword([EVENTS.ACTION])
    .addAnswer('¿Que tipo de prenda necesita?', { capture: true }, async (ctx, ctxFn) => {
        //ctxFn.producto = ctx.body; // Guardamos el nombre del producto en el contexto
        itemProducto = ctx.body;
        return ctxFn.gotoFlow(flowCantidad);
    });


const flowRUC = addKeyword([EVENTS.ACTION])
    .addAnswer('¿Cuál es tu RUC o Cedula?', { capture: true }, async (ctx, ctxFn) => {
        clienteInfo.ruc = ctx.body;
        return ctxFn.gotoFlow(flowProducto);
    });

const flowCliente = addKeyword([EVENTS.ACTION])
    .addAnswer('¿Podrías facilitarme tu nombre de cliente?', { capture: true }, async (ctx, ctxFn) => {
        clienteInfo.nombre = ctx.body;
        return ctxFn.gotoFlow(flowRUC);
    });

const flowCantidad = addKeyword([EVENTS.ACTION])
    .addAnswer('¿Cuál es la cantidad que necesita?', { capture: true }, async (ctx, ctxFn) => {
        const cantidad = ctx.body;
        pedido.push({ producto: itemProducto, cantidad });
        itemProducto = '';
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
        flowCantidad,
        flowConsulta,
        flowCatalogo
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
