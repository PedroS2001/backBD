const express = require('express')
const db = require('../models/db');

router = express.Router();

//El motivo por el que llegan mas tickets
router.get('/motivo', (req, res) => {
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
            res.send(data[0]);
        })
});

//Todos los tickets que estan sin resolver
router.get('/sinresolver', (req, res) => {
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
router.get('/esteano', (req, res) => {
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
router.get('/zonasur', (req, res) => {
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
router.get('/unpaso', (req, res) => {
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
router.get('/desperfecto', (req, res) => {
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
router.get('/buscar/:palabra', (req, res) => {

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