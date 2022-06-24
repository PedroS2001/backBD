const express = require('express')
const db = require('../models/db');

router = express.Router();


//La cantidad de tickets de cada cliente, y el nombre del cliente
router.get('/cantidadtickets', (req, res) => {
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
router.get('/nonormal', (req, res) => {
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
router.get('/barrio', (req, res) => {
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
router.get('/clienteslocalidad', (req, res) => {
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




module.exports = router;