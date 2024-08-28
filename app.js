const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
require('dotenv').config();
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
//const MysqlAdapter = require('@bot-whatsapp/database/mysql')
const MockAdapter = require('@bot-whatsapp/database/mock')
const pool = require('./dbConfig');
//---------------------------------------------------------------
let clienteInfo = {};
let pedido = [];
let itemProducto = '';
let idusuario = '595992424757';
//---------------------------------------------------------------

const flowInicial = addKeyword(['hola', 'Hola', 'Buenas', 'buenas', 'Buenos', 'buenos', '!consulta'])
    .addAction(async (ctx, { gotoFlow, state }) => {
        const myState = state?.getMyState();
        //console.log('Estado actual:', myState);

        if (myState && myState.iniciado) {
            // Verifica el estado actual del usuario y redirige según sea necesario
            if (myState.enCurso) {
                console.log('Conversación en curso, continuando...');
                // Continuar desde el punto en el que se quedó
                // Por ejemplo, podrías redirigir a un flujo específico basado en `myState.enCurso`
                return gotoFlow(myState.enCurso);
            } else {
                // Si no hay un flujo en curso, redirige a la bienvenida o al punto inicial
                return gotoFlow(bienvenidaFlow);
            }
        } else {
            // Estado no encontrado, iniciar conversación
            await state.update({ iniciado: true, enCurso: bienvenidaFlow });
            return gotoFlow(bienvenidaFlow);

        }
    });

const bienvenidaFlow = addKeyword([EVENTS.ACTION])
    .addAnswer(
        `🍦 Gracias por comunicarte con Dolce Helados 🫱🏽‍🫲🏾`,
        { delay: 1000, }
    ).addAnswer(
        `🕥 Nuestro horario de atención son:
☑ Lunes a Viernes de 09:00 hs a 12:00 hs y 13:00 hs a 18:00 hs.
☑ Sabados de 09:00 hs a 12:00 hs y 13:00 hs a 18:00 hs.
☑ Domingos de 13:00 hs a 18:00 hs.`,
        { delay: 1000, }
    ).addAnswer(
        `En que podemos ayudarte?
A) Realizar pedido.
B) Quiero hacer una consulta.
C) Necesito el catalogo.
D) Contactar con un asesor.
0) Salir de contestador.
`,
        {
            capture: true,
            delay: 2000,
        },
        async (ctx, { gotoFlow, fallBack, flowDynamic, state }) => {
            if (!["a", "b", "c", "d", "0"].includes(ctx.body.toLowerCase())) {
                return fallBack(
                    `🔴 Respuesta no válida, por favor selecciona una de las opciones.`
                );
            }
            switch (ctx.body.toLowerCase()) {
                case "a":
                    await state.update({ enCurso: flowCliente });
                    return gotoFlow(flowCliente);
                case "b":
                    await state.update({ enCurso: flowConsulta });
                    return gotoFlow(flowConsulta);
                case "c":
                    await state.update({ enCurso: flowCatalogo });
                    return gotoFlow(flowCatalogo);
                case "d":
                    await state.update({ enCurso: flowAsesor });
                    return gotoFlow(flowAsesor);
                case "0":
                    await flowDynamic("_Saliendo... Puedes volver a acceder al contestador enviando !consulta_");
                    await state.update({ iniciado: false, enCurso: null });
                    break;
            }
        }
    );

const flowCatalogo = addKeyword(EVENTS.ACTION)
    .addAnswer(
        `Gracias por comunicarte con nosotros.
Envio del catalogo 📑 en proceso.
_Puedes volver a acceder al contestador enviando !consulta_`
    )
    .addAnswer('Aqui el catalogo.'
        , {
            //delay: 1000,
            media: "https://mindtechpy.net/files_upload/catalogo_dolce_helados.pdf"
        }, async (ctx, { state }) => {
            await state.update({ iniciado: false, enCurso: null });
        })

const flowAgregarProducto = addKeyword([EVENTS.ACTION])
    .addAnswer('¿Quieres agregar otro producto? (sí/no)', { capture: true }, async (ctx, { flowDynamic, state, gotoFlow }) => {
        if (ctx.body.toLowerCase() === 'sí' || ctx.body.toLowerCase() === 'si') {
            await flowDynamic('Vamos a agregar otro producto.');
            await state.update({ enCurso: flowProducto });
            return gotoFlow(flowProducto);
        } else {
            await flowDynamic('Gracias, tu pedido ha sido registrado.');
            console.log('Pedido completo:', pedido);
            // Guardar el pedido en la base de datos
            try {
                const connection = await pool.getConnection();
                const [result] = await connection.query('INSERT INTO pedido (cliente, ruc, idusuario, numero, estado) VALUES (?, ?, ?, ?, ?)', [clienteInfo.nombre, clienteInfo.ruc, idusuario, ctx.from ?? 'null', 'Pendiente']);
                const idpedido = result.insertId;

                for (const item of pedido) {
                    await connection.query('INSERT INTO det_pedido (producto, cantidad, idpedido) VALUES (?, ?, ?)', [item.producto, item.cantidad, idpedido]);
                }
                pedido = [];
                connection.release();
                console.log('Pedido guardado en la base de datos con éxito.');
                await state.update({ iniciado: false, enCurso: null });
            } catch (error) {
                console.error('Error al guardar el pedido en la base de datos:', error);
                await state.update({ iniciado: false, enCurso: null });
            }
        }
    });

const flowConsulta = addKeyword([EVENTS.ACTION])
    .addAnswer('Podrias darme el detalle de tu consulta?', { capture: true }, async (ctx, { flowDynamic, state }) => {
        //const consulta = ctx.body;
        await flowDynamic("Gracias, te respondere la duda en la brevedad posible")
        await flowDynamic("Saludos!")
        await state.update({ iniciado: false, enCurso: null });
    })

const flowAsesor = addKeyword([EVENTS.ACTION])
    .addAnswer('Puedes comunicarte con Arturo Villasboa al https://wa.me/595992424757/', { capture: true }, async (ctx, { state }) => {
        await state.update({ iniciado: false, enCurso: null });
    })

const flowProducto = addKeyword([EVENTS.ACTION])
    .addAnswer(
        `Podria indicarme el producto que desea. 
_Para cancelar responda 0_`
        , { capture: true }, async (ctx, { gotoFlow, state, flowDynamic }) => {

            console.log(state?.getMyState())

            if (ctx.body.toLowerCase() == "0") {
                await state.update({ iniciado: false, enCurso: null });
                await flowDynamic("Gracias por comunicarte, si desea volver a generar el contestador envie !consulta")
            } else {
                itemProducto = ctx.body;
                return gotoFlow(flowCantidad);
            }
        });


const flowRUC = addKeyword([EVENTS.ACTION])
    .addAnswer(
        `¿Cuál es tu RUC o Cedula? 
_Para cancelar responda 0_`, { capture: true },
        async (ctx, { state, flowDynamic, gotoFlow }) => {
            if (ctx.body.toLowerCase() == "0") {
                await state.update({ iniciado: false, enCurso: null });
                await flowDynamic("Gracias por comunicarte, si desea volver a generar el contestador envie !consulta_")
            } else {
                clienteInfo.ruc = ctx.body;
                return gotoFlow(flowProducto);
            }
        });

const flowCliente = addKeyword([EVENTS.ACTION])
    .addAnswer(
        `¿Podrías facilitarme tu nombre de cliente? 
_Para cancelar responda 0_`
        , { capture: true }, async (ctx, { flowDynamic, gotoFlow, state }) => {
            if (ctx.body.toLowerCase() == "0") {
                await state.update({ iniciado: false, enCurso: null });
                await flowDynamic("_Gracias por comunicarte, si desea volver a generar el contestador envie !consulta_")
            } else {
                clienteInfo.nombre = ctx.body;
                return gotoFlow(flowRUC);
            }
        });

const flowCantidad = addKeyword([EVENTS.ACTION])
    .addAnswer(
        `¿Cuál es la cantidad que necesita? 
_Para cancelar responda 0_`
        , { capture: true }, async (ctx, { state, flowDynamic, gotoFlow }) => {
            if (ctx.body.toLowerCase() == "0") {
                await state.update({ iniciado: false, enCurso: null });
                await flowDynamic("_Gracias por comunicarte, si desea volver a generar el contestador envie !consulta_")
            } else {
                const cantidad = ctx.body;
                pedido.push({ producto: itemProducto, cantidad });
                itemProducto = '';
                return gotoFlow(flowAgregarProducto);
            }
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
        flowCatalogo,
        flowAsesor,
        flowInicial
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
