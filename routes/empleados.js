const express = require('express')
const db = require('../models/db');

router = express.Router();


//El nombre del empleado y la cantidad de tickets que atendio c/u
router.get('/tickets', (req, res) => {
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
router.get('/mastickets', (req, res) => {
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
router.get('/tecnicoscerca', (req, res) => {

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
                    $maxDistance: 2000
                }
            }
        })
            .toArray().then(data => {
                res.send(data);
            })
    })

});


router.get('/yclientes', (req, res) => {
    db.getInstance().collection('clientes').aggregate([
        {
            $lookup:
            {
                from: "empleados",
                localField: "dni",
                foreignField: "dni",
                as: "conecta"
            }
        },
        {
            $project: {
                "nombre": 1,
                "apellido": 1,
                "conecta": 1,
                "_id": 0
            }
        }])
        .toArray().then(data => {
            res.send(data);
        })
});







module.exports = router;