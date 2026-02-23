// =======================================
// SCRIPT PRINCIPAL - Chicos Washing
// =======================================

// 🔹 Configuración Firebase (UNA SOLA VEZ)
const firebaseConfig = {
    apiKey: "AIzaSyARrW902od6klb3wL6wvvd9BJBxeveN0SY",
    authDomain: "chicos-washing.firebaseapp.com",
    databaseURL: "https://chicos-washing-default-rtdb.firebaseio.com",
    projectId: "chicos-washing",
    storageBucket: "chicos-washing.appspot.com",
    messagingSenderId: "243101499379",
    appId: "1:243101499379:web:aa7d15b8b433bd355a5c86"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// =======================================
// 🔐 BLOQUEO POR CONTRASEÑA
// =======================================
window.onload = function () {
    const clave = prompt("La página es privada, ingresa contraseña:");

    if (clave === "123456") {
        document.body.style.display = "flex";
        cargarUltimoFolio();
        activarCalculoTotal();
        activarCalculoExtras();
    } else {
        alert("Contraseña incorrecta. No se puede acceder.");
        window.location.href = "index.html";
    }
};

// =======================================
// 🔢 ÚLTIMO FOLIO
// =======================================
function cargarUltimoFolio() {
    database.ref("recibos").once("value", snapshot => {

        let mayor = 0;

        snapshot.forEach(child => {
            const f = parseInt(child.val().folio);
            if (!isNaN(f) && f > mayor) mayor = f;
        });

        document.getElementById("ultimoFolio").textContent =
            `Último folio registrado: ${mayor}`;

        document.getElementById("folio").value = mayor + 1;
    });
}

// =======================================
// 🧮 CÁLCULO BASE (SOLO KILOS)
// =======================================
function activarCalculoTotal() {
    const kilosInput = document.getElementById("kilos");
    const totalInput = document.getElementById("total");

    if (!kilosInput || !totalInput) return;

    kilosInput.addEventListener("input", () => {
        const kilos = parseFloat(kilosInput.value) || 0;
        if (!totalInput.dataset.editado) {
            totalInput.value = kilos * 18;
        }
    });

    totalInput.addEventListener("input", () => {
        totalInput.dataset.editado = "true";
    });
}

// =======================================
// ☁️ ENVIAR A FIREBASE
// =======================================
function enviarDatosAFirebase(
    cliente, folio, fechaIngreso, total, servicio, kilos,
    fechaEntrega, horaEntrega, detalleServicio, lavadas, estado, metodoPago
) {

    const reciboData = {
        cliente,
        folio,
        fechaIngreso,
        total,
        servicio,
        kilos,
        fechaEntrega,
        horaEntrega,
        ropaEntregada: detalleServicio,
        lavadas,
        estado,
        metodoPago
    };

    database.ref("recibos").push(reciboData)
        .then(() => cargarUltimoFolio())
        .catch(error => console.error("Error al enviar datos:", error));
}

// =======================================
// 🗓️ UTILIDADES DE FECHA Y HORA
// =======================================
function formatDate(dateString) {
    const [y, m, d] = dateString.split("-");
    return `${d}-${m}-${y}`;
}

function formatoHora(hora24) {
    if (!hora24) return "Sin hora asignada";
    const [h, min] = hora24.split(":");
    const hh = parseInt(h);
    const ampm = hh >= 12 ? "PM" : "AM";
    const h12 = hh % 12 || 12;
    return `${h12}:${min} ${ampm}`;
}

function fechaActual() {
    return new Date().toLocaleDateString("es-MX");
}

// =======================================
// 🧾 GENERAR RECIBO
// =======================================
function generarRecibo() {

    const cliente = document.getElementById("cliente").value.trim();
    const servicio = document.getElementById("lavanderia").value;
    const kilos = document.getElementById("kilos").value;
    const folio = document.getElementById("folio").value.trim();
    const fechaIngresoRaw = document.getElementById("fechaIngreso").value;
    const total = document.getElementById("total").value;
    const fechaEntregaRaw = document.getElementById("fechaEntrega").value;
    const horaEntregaRaw = document.getElementById("horaEntrega").value;
    const estado = document.getElementById("estado").value;
    const metodoPago = document.getElementById("metodoPago").value;

    const detalleServicio = generarDetalleCompletoServicio(parseFloat(kilos) || 0);

    if (!folio || !cliente || !kilos || !fechaIngresoRaw || !total || !fechaEntregaRaw) {
        alert("Por favor, complete todos los campos obligatorios.");
        return;
    }

    const fechaIngreso = formatDate(fechaIngresoRaw);
    const fechaEntrega = formatDate(fechaEntregaRaw);
    const horaEntrega = formatoHora(horaEntregaRaw);

    enviarDatosAFirebase(
        cliente, folio, fechaIngreso, total, servicio, kilos,
        fechaEntrega, horaEntrega, detalleServicio, 0, estado, metodoPago
    );

    document.getElementById("recibo").innerHTML = `
        <div class="recibo-header">
            <img src="imagenes/logo1.png" class="recibo-logo">
            <div>
                <div class="recibo-titulo">CHICOS WASHING</div>
                <small>Los maestros de la lavandería</small><br>
                <small>Fecha: ${fechaActual()}</small>
            </div>
        </div>

        <div class="linea"></div>

        <div class="datos-recibo">
            <p><strong>Folio:</strong> ${folio}</p>
            <p><strong>Cliente:</strong> ${cliente}</p>
            <p><strong>Servicio:</strong> ${servicio}</p>
            <p><strong>Detalle del servicio:</strong><br>${detalleServicio}</p>
            <p><strong>Total a pagar:</strong> <span class="total">$${total}</span></p>
            <p><strong>Estado:</strong> ${estado}</p>
            <p><strong>Método de pago:</strong> ${metodoPago}</p>
            <p><strong>Ingreso:</strong> ${fechaIngreso}</p>
            <p><strong>Entrega:</strong> ${fechaEntrega}</p>
            <p><strong>Hora:</strong> ${horaEntrega}</p>
        </div>

        <div class="linea"></div>

        <div class="recibo-footer">
            <p><strong>Tel:</strong> +52 222 330 8607</p>
            <p>¡Gracias por su preferencia!</p>
        </div>
    `;

    document.getElementById("recibo").classList.remove("hidden");
    document.getElementById("accionesRecibo").classList.remove("hidden");
    document.getElementById("recibo").scrollIntoView({ behavior: "smooth" });
}

// =======================================
// 📤 COMPARTIR RECIBO COMO IMAGEN (WHATSAPP)
// =======================================
function compartirRecibo() {
    const recibo = document.getElementById("recibo");

    if (!recibo || recibo.classList.contains("hidden")) {
        alert("Primero genera un recibo.");
        return;
    }

    html2canvas(recibo, {
        scale: 3,
        backgroundColor: "#ffffff"
    }).then(canvas => {

        canvas.toBlob(blob => {

            const archivo = new File(
                [blob],
                `recibo_chicos_washing_${Date.now()}.png`,
                { type: "image/png" }
            );

            if (navigator.share) {
                navigator.share({
                    files: [archivo],
                    title: "Recibo - Chicos Washing",
                    text: "Aquí está tu recibo 🧺"
                }).catch(() => descargarImagen(canvas));
            } else {
                descargarImagen(canvas);
            }
        });
    });
}

// =======================================
// 💾 DESCARGA DE RESPALDO (PC)
// =======================================
function descargarImagen(canvas) {
    const link = document.createElement("a");
    link.download = "recibo_chicos_washing.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}
