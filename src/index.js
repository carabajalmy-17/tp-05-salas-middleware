const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const { error } = require("node:console");
const path = require("node:path");

const app = express();
const PORT = 3000;

const reservas = [
    {
        "id": 1,
        "estudiante": "malena carabajal",
        "email": "malena65@gmail.com",
        "sala": "Sala Norte",
        "fecha": "17-12-2026",
        "turno": "Mañana",
        "personas": 2
    },
    {
        "id": 2,
        "estudiante": "Florencia Rojas",
        "email": "florencia23@gmail.com",
        "sala": "Sala Sur",
        "fecha": "20-12-2026",
        "turno": "Tarde",
        "personas": 6
    },
    {
        "id": 3,
        "estudiante": "Facundo Sanchez",
        "email": "sanchez49@gmail.com",
        "sala": "Sala Multimedia",
        "fecha": "07-11-2026",
        "turno": "Noche",
        "personas": 4
    },
    {
        "id": 4,
        "estudiante": "Cristian Valle",
        "email": "Crvalle75@gmail.com",
        "sala": "Sala Norte",
        "fecha": "25-11-2026",
        "turno": "Mañana",
        "personas": 4
    }
]

let numeroDeSolicitud = 0;

function identificarSolicitud(req, res, next) {
    numeroDeSolicitud += 1;
    res.locals.solicitudId = `CAM-${String(numeroDeSolicitud)}`;
    console.log(
        `identificar solicitud : [${res.locals.solicitudId}] ${req.method} ${req.orginalUrl}`
    );
    next();
}

function medirDuracion(req, res, next) {
    const inicio = process.hrtime.bigint();
    res.on("finish", () => {
        const duracion = Number(process.hrtime.bigint() - inicio) / 1_000_000;
        console.log(`duracion: [${res.locals.solicitudId}] ${req.method} ${req.orginalUrl} ${res.statusCode} ${duracion.toFixed(2)} ms`);
    });

    next();
}

function prepararAreaReservas(req, res, next) {
    res.locals.seccion = "Reservas";
    console.log("seccion: " + res.locals.seccion);
    next();
}

function validarReserva(req, res, next) {
    const estudiante = String(req.body.estudiante ?? "").trim();
    const email = String(req.body.email ?? "").trim();
    const sala = String(req.body.sala ?? "").trim();
    const salasPermitidas = ["Sala Norte", "Sala Sur", "Sala Multimedia"];
    const fecha = String(req.body.fecha ?? "").trim();
    const turno = String(req.body.turno ?? "").trim();
    const turnosPermitidos = ["Mañana", "Tarde", "Noche"];
    const cantidadPersonas = Number(req.body.personas);

    const datosValidos =
        estudiante !== "" &&
        email !== "" &&
        salasPermitidas.includes(sala) &&
        fecha !== "" &&
        turnosPermitidos.includes(turno) &&
        Number.isInteger(cantidadPersonas) &&
        cantidadPersonas >= 1 &&
        cantidadPersonas <= 6;

    if (!datosValidos) {
        return res.status(400).render("reservas/nueva", {
            titulo: "Nueva Reserva",
            error: "Completá todos los campos con valores válidos.",
            valores: req.body
        });
    }

    req.reservaValidad = { estudiante, email, sala, fecha, turno, cantidadPersonas }

    next();
}

function crearReserva(req, res) {
    const ultimoId = reservas.length === 0 ? 0 : reservas[reservas.length - 1].id;
    reservas.push({
        id: ultimoId + 1,
        ...req.reservaValidad
    })
    res.redirect("/reservas");
}


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.set("layout", "layouts/main");

app.use(morgan("dev"));
app.use(identificarSolicitud);
app.use(medirDuracion);
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


app.get("/", (req, res) => {
    res.render("inicio", {
        titulo: "Reserva de Salas de Estudio"
    })
})

const reservasRouter = express.Router();

reservasRouter.use(prepararAreaReservas);

reservasRouter.get("/", (req, res) => {
    res.render("reservas/lista", {
        titulo: "reservas realizadas",
        reservas
    })
});

reservasRouter.get("/nueva", (req, res) => {
    res.render("reservas/nueva", {
        titulo: "Nueva Reserva",
        error: null,
        valores: {}
    })
})

reservasRouter.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    const reserva = reservas.find((elemento) => elemento.id === id);

    if (!reserva){
        return res.status(404).render("no-encontrado", {
            titulo: "reserva no encontrada",
            mensaje: "no se encontro reserva con ese identificador."
        })
    }

    res.render("reservas/detalle", {
        titulo: reserva.estudiante,
        reserva
    })
})

reservasRouter.post("/", validarReserva, crearReserva);

app.use("/reservas", reservasRouter);

app.listen(PORT, () => {
    console.log(`servidor funcionando en http://localhost:${PORT}`)
})