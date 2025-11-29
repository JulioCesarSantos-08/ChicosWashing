// 🔹 Configuración Firebase
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

// 🔹 Bloqueo por contraseña
window.onload = function () {
    const clave = prompt("La página es privada, ingresa contraseña:");
    if (clave === "123456") {
        document.body.style.display = "flex";
        cargarUltimoFolio(); 
    } else {
        alert("Contraseña incorrecta. No se puede acceder.");
        window.location.href = "index.html";
    }
};

// 🔹 Cargar último folio registrado
function cargarUltimoFolio() {
    const ref = database.ref("recibos").orderByChild("folio").limitToLast(1);
    ref.once("value", snapshot => {
        let ultimoFolio = 0;
        snapshot.forEach(child => {
            ultimoFolio = parseInt(child.val().folio) || 0;
        });
        document.getElementById("ultimoFolio").textContent = `Último folio registrado: ${ultimoFolio}`;
        document.getElementById("folio").value = ultimoFolio + 1;
    });
}

// 🔹 Enviar datos a Firebase
function enviarDatosAFirebase(cliente, folio, fechaIngreso, total, servicio, kilos, fechaEntrega, horaEntrega, ropaEntregada, lavadas, estado, metodoPago) {
    const reciboData = {
        cliente,
        folio,
        fechaIngreso,
        total,
        servicio,
        kilos,
        fechaEntrega,
        horaEntrega,
        ropaEntregada,
        lavadas,
        estado,
        metodoPago
    };

    database.ref("recibos").push(reciboData)
        .then(() => cargarUltimoFolio())
        .catch(error => console.error("Error al enviar datos:", error));
}

// 🔹 Formato fecha
function formatDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
}

// 🔹 Formato hora
function formatoHora(hora24) {
    const [hora, minutos] = hora24.split(":");
    const h = parseInt(hora, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const hora12 = h % 12 || 12;
    return `${hora12}:${minutos} ${ampm}`;
}

// 🔹 FECHA AUTOMÁTICA
function fechaActual() {
    const hoy = new Date();
    let d = hoy.getDate().toString().padStart(2, "0");
    let m = (hoy.getMonth() + 1).toString().padStart(2, "0");
    let y = hoy.getFullYear();
    return `${d}-${m}-${y}`;
}

// 🔹 GENERAR RECIBO PROFESIONAL
function generarRecibo() {

    // Obtener datos
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
    const ropaEntregada = document.getElementById("descripcion").value.trim() || "No especificada";

    // Validación
    if (!folio || !cliente || !kilos || !fechaIngresoRaw || !total || !fechaEntregaRaw || !horaEntregaRaw || !estado || !metodoPago) {
        alert("Por favor, complete todos los campos.");
        return;
    }

    const fechaIngreso = formatDate(fechaIngresoRaw);
    const fechaEntrega = formatDate(fechaEntregaRaw);
    const horaEntrega = formatoHora(horaEntregaRaw);

    // Guardar en Firebase
    enviarDatosAFirebase(cliente, folio, fechaIngreso, total, servicio, kilos, fechaEntrega, horaEntrega, ropaEntregada, 0, estado, metodoPago);

    // Plantilla nueva del recibo tipo FACTURA
    document.getElementById("recibo").innerHTML = `

        <div class="recibo-header">
            <img src="imagenes/logo1.png" class="recibo-logo">
            <div>
                <div class="recibo-titulo">CHICOS WASHING</div>
                <small>Los maestros de la lavanderìa</small><br>
                <small>Servicio profesional de lavandería</small><br>
                <small>Fecha: ${fechaActual()}</small>
            </div>
        </div>

        <div class="linea"></div>

        <div class="datos-recibo">
            <p><strong>Folio:</strong> <span class="folio">${folio}</span></p>
            <p><strong>Cliente:</strong> ${cliente}</p>
            <p><strong>Servicio:</strong> ${servicio}</p>
            <p><strong>Kilos:</strong> ${kilos} kg</p>
            <p><strong>Ropa entregada:</strong> ${ropaEntregada}</p>
            <p><strong>Total a pagar:</strong> <span class="total">$${total}</span></p>
            <p><strong>Estado del pago:</strong> <span class="estado-pago">${estado}</span></p>
            <p><strong>Método de pago:</strong> ${metodoPago}</p>
            <p><strong>Fecha ingreso:</strong> ${fechaIngreso}</p>
            <p><strong>Fecha entrega:</strong> ${fechaEntrega}</p>
            <p><strong>Hora entrega:</strong> ${horaEntrega}</p>
        </div>

        <div class="linea"></div>

        <div class="recibo-footer">
            <p><strong>Tel:</strong> +52 222 330 8607</p>
            <p><strong>Dirección:</strong> Cerca de C. 5 Sur 5705, Villa Encantada, 72440 Heroica Puebla de Zaragoza, Pue.</p>
            <p>¡Gracias por su preferencia!</p>
        </div>

    `;

    document.getElementById("recibo").classList.remove("hidden");
    document.getElementById("recibo").scrollIntoView({ behavior: 'smooth' });
}
