const express = require('express')
const db = require('../models/db');

router = express.Router();

router.get('/', (req, res) => {
    res.send('Api UP')
});

router.get('/a', (req, res) => {
    db.getInstance().collection('tickets').find().toArray().then(data => {
        res.send(data);
    })
});





/**************************** EMPLEADO ******************** */

//El nombre del empleado y la cantidad de tickets que atendio c/u
router.get('/ticketsxempleado', (req, res) => {
    db.getInstance().collection('tickets').aggregate([
        {
            $unwind: "$responsables"
        },
        {
            $group: {
                _id: { idEmpleado: "$responsables.idEmpleado", nombre: "$responsables.nombre", apellido: "$responsables.apellido" },
                atendidos: { $sum: 1 }
            }
        },
        {
            $project: {
                "idEmpleado": "$_id.idEmpleado",
                "nombre": "$_id.nombre",
                "apellido": "$_id.apellido",
                "atendidos": 1,
                "_id": 0
            }
        }])
        .toArray().then(data => {
            res.send(data);
        })
});

//El empleado (1) que atendio mas tickets y la cantidad que atendio
router.get('/empleadomastickets', (req, res) => {
    db.getInstance().collection('tickets').aggregate([
        {
            $unwind: "$responsables"
        },
        {
            $group: {
                _id: "$responsables",
                atendidos: { $sum: 1 }
            }
        },
        {
            $sort: {
                atendidos: -1
            }
        },
        {
            $limit: 1
        },
        {
            $project: {
                "empleado": "$_id",
                "atendidos": 1,
                "_id": 0
            }
        }])
        .toArray().then(data => {
            res.send(data[0]);
        })
});

//Todos los empleados que son tecnicos
router.get('/tecnicos', (req, res) => {
    db.getInstance().collection('empleados').find({
        camino: { $exists: true }
    },
        {
            fields: {
                "_id": 0,
            }
        })
        .toArray().then(data => {
            res.send(data);
        })
});

//Si hay algun tecnico que pase a 2km de un cliente (para que el cliente vaya a esperarlo y le devuelva el equipo)
router.get('/tecnicosCerca', (req, res) => {

    db.getInstance().collection("tickets").findOne(
        { "motivo": "devolucion" },
        { fields: { cliente: 1 } }
    ).then((ticketDevolucion) => {
        db.getInstance().collection('empleados').find({
            tipo: "tecnico",
            camino: {
                $near:
                {
                    $geometry: ticketDevolucion.cliente.ubicacion,
                    $maxDistance: 20000
                }
            }
        })
            .toArray().then(data => {
                res.send(data);
            })
    })


});









/**************************** CLIENTE ******************** */

//La cantidad de tickets de cada cliente, y el nombre del cliente
router.get('/clientes', (req, res) => {
    db.getInstance().collection('tickets').aggregate([
        {
            $unwind: "$cliente"
        },
        {
            $group: {
                _id: { dni: "$cliente.dni", nombre: "$cliente.nombre", apellido: "$cliente.apellido" },
                tickets: { $sum: 1 }
            }
        },
        {
            $project: {
                "DNI": "$_id.dni",
                "nombre": "$_id.nombre",
                "apellido": "$_id.apellido",
                "tickets": 1,
                "_id": 0
            }
        }
    ])
        .toArray().then(data => {
            res.send(data);
        })
});

//Todos los Clientes que no tengan plan normal
router.get('/clientesnonormal', (req, res) => {
    db.getInstance().collection('clientes').find({
        "tipo_de_plan.tipo": { $ne: "Normal" }
    },
        {
            fields: {
                "_id": 0,
                "localidad.posicion": 0
            }
        })
        .toArray().then(data => {
            res.send(data);
        })
});

//Los clientes que tienen todos los canales de aire
router.get('/canalesaire', (req, res) => {
    db.getInstance().collection('clientes').find({
        "tipo_de_plan.canales": {
            $all: [7, 9, 10, 12]
        }
    },
        {
            fields: {
                "_id": 0,
                "localidad.posicion": 0
            }
        })
        .toArray().then(data => {
            res.send(data);
        })
});

//De que barrio es un cliente determinado
router.get('/barriocliente', (req, res) => {
    db.getInstance().collection('clientes').findOne({}).then((cliente) => {

        db.getInstance().collection('localidades').findOne({
            posicion:
            {
                $geoIntersects:
                {
                    $geometry: cliente.ubicacion
                }
            }
        }, {
            fields: {
                "_id": 0,
                "nombre": 1,
                "descripcion": 1,
                "codigo_postal": 1
            }
        })
            .then(data => {
                res.send(data);
            })
    });
});

//Todos los clientes con su localidad
router.get('/clientesLocalidad', (req, res) => {
    db.getInstance().collection('clientes').aggregate([
        {
            $lookup:
            {
                from: "localidades",
                localField: "localidad.nombre",
                foreignField: "nombre",
                as: "nombreLocalidad"
            }
        },
        {
            $project: {
                "nombre": 1,
                "apellido": 1,
                "nombreLocalidad.nombre": 1,
                "_id": 0
            }
        }
    ])
        .toArray().then(data => {
            res.send(data);
        })
});









/**************************** CONTROL TICKETS ******************** */

//El motivo por el que llegan mas tickets
router.get('/motivomastickets', (req, res) => {
    db.getInstance().collection('tickets').aggregate([
        {
            $group: {
                _id: "$motivo",
                cantidad: { $sum: 1 }
            }
        },
        {
            $sort: {
                cantidad: -1
            }
        },
        {
            $limit: 1
        },
        {
            $project: {
                "motivo": "$_id",
                "cantidad": 1,
                "_id": 0
            }
        }
    ])
        .toArray().then(data => {
            res.send(data);
        })
});

//Todos los tickets que estan sin resolver
router.get('/ticketssinresolver', (req, res) => {
    db.getInstance().collection('tickets').aggregate([
        {
            $match: {
                resuelto: false
            }
        },
        {
            $project: {
                "cliente.localidad.posicion": 0,
                "_id": 0
            }
        }
    ])
        .toArray().then(data => {
            res.send(data);
        })
});

//Cantidad de tickets en el ano 2022
router.get('/ticketsenelano', (req, res) => {
    db.getInstance().collection('tickets').find({
        $and: [
            {
                fecha_inicio: { $lte: new Date("2022/12/31") }
            },
            {
                fecha_inicio: { $gte: new Date("2022/1/1") }
            }
        ]
    })
        .count().then((data) => {
            res.send(data.toString())
        })
});

//Tickets de los clientes de Zona Sur
router.get('/ticketszonasur', (req, res) => {
    db.getInstance().collection('tickets').find({
        "cliente.localidad.nombre": { $in: ["Avellaneda", "Quilmes", "Lanus"] }
    },
        {
            fields:
            {
                "cliente.localidad.posicion": 0
            }
        })
        .toArray().then(data => {
            res.send(data);
        })
});

//Todos los tickets que se resolvieron en un solo paso
router.get('/resueltosunpaso', (req, res) => {
    db.getInstance().collection('tickets').find({
        $and: [
            {
                pasos: {
                    $size: 1
                }
            },
            {
                resuelto: true
            }
        ]
    },
        {
            fields:
            {
                "cliente.localidad.posicion": 0
            }
        })
        .toArray().then(data => {
            res.send(data);
        })
});

//Tickets cargados por desperfecto sin resolver dentro del area de cobertura de las oficinas de servicio tecnico
router.get('/desperfectosinresolver', (req, res) => {
    db.getInstance().collection('oficinas').findOne({ "idOficina": 3 }).then((oficina1) => {
        db.getInstance().collection('oficinas').findOne({ "idOficina": 2 }).then((oficina2) => {
            db.getInstance().collection('tickets').find({
                $and: [
                    { "resuelto": false },
                    { "motivo": "Desperfecto" },
                    {
                        $or: [
                            {
                                "cliente.ubicacion": {
                                    $geoWithin: {
                                        $geometry: oficina1.area_cobertura
                                    }
                                }
                            },
                            {
                                "cliente.ubicacion": {
                                    $geoWithin: {
                                        $geometry: oficina2.area_cobertura
                                    }
                                }
                            }
                        ]
                    }
                ]
            }).toArray().then((data) => {
                res.send(data);
            })
        })
    })
});


//Buscar texto en los tickets
router.get('/buscarEnTickets/:palabra', (req, res) => {

    let palabra = req.params.palabra;
    db.getInstance().collection('tickets').find({
        $text: {
            $search: palabra
        }
    },
        {
            fields:
            {
                "_id": 0,
                "cliente.localidad.posicion": 0,
                "responsables.camino": 0,
                "coincidencia": { $meta: "textScore" }
            }
        }
    ).sort({ score: { $meta: "textScore" } })
        .toArray().then(data => {
            res.send(data);
        })
});










module.exports = router;